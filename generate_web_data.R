library(Matrix)
library(dplyr)
library(Seurat)

#prerequisites
if (!exists("hb_lar1_renamed")) {
  stop("ERROR: hb_lar1_renamed not found in environment.\n
        Please run hb_scseq_reanalysis_v2.Rmd first.")
}

if (!file.exists("predict_IPN_idents.csv")) {
  stop("ERROR: predict_IPN_idents.csv not found in working directory.")
}

if (!file.exists("lar1/matrix.mtx")) {
  stop("ERROR: lar1/ folder with 10X data not found.")
}



# Load IPN predictions
ipn <- read.csv("predict_IPN_idents.csv")
colnames(ipn) <- c("cell_barcode", "IPN_domain")
cat("Loaded IPN predictions for", nrow(ipn), "cells\n\n")


#export UMAP Coordinates
umap_coords <- as.data.frame(hb_lar1_renamed@reductions$umap@cell.embeddings)
colnames(umap_coords) <- c("UMAP_1", "UMAP_2")
umap_coords$cell_barcode <- rownames(umap_coords)
umap_coords$cluster <- as.character(hb_lar1_renamed@active.ident)

umap_data <- merge(umap_coords, ipn, by = "cell_barcode")
write.csv(umap_data, "umap_coordinates.csv", row.names = FALSE)
cat("  Saved: umap_coordinates.csv (", nrow(umap_data), " cells)\n\n")

# export Gene List
gene_list <- data.frame(gene = rownames(hb_lar1_renamed))
write.csv(gene_list, "gene_list.csv", row.names = FALSE)
cat("  Saved: gene_list.csv (", nrow(gene_list), " genes)\n\n")


#export individual Gene Expression files
dir.create("gene_data", showWarnings = FALSE)

# Access expression matrix (Seurat v5 syntax)
expr <- hb_lar1_renamed@assays$RNA$data
cell_barcodes <- colnames(expr)
gene_names <- rownames(expr)
total_genes <- length(gene_names)

for (i in seq_along(gene_names)) {
  gene <- gene_names[i]
  
  gene_df <- data.frame(
    cell_barcode = cell_barcodes,
    expression = as.numeric(expr[i, ])
  )
  
  # Sanitize gene name for valid filename
  safe_name <- gsub("[^A-Za-z0-9._-]", "_", gene)
  write.csv(gene_df, paste0("gene_data/", safe_name, ".csv"), row.names = FALSE)
  
  if (i %% 2000 == 0) {
    cat("  Progress:", i, "/", total_genes, "\n")
  }
}
cat("  Saved: gene_data/*.csv (", total_genes, " files)\n\n")


#load Raw 10X Data for Gene-IPN Mapping
mat <- readMM("lar1/matrix.mtx")
genes_tsv <- read.table("lar1/genes.tsv", sep = "\t", stringsAsFactors = FALSE)
barcodes_tsv <- read.table("lar1/barcodes.tsv", stringsAsFactors = FALSE)

rownames(mat) <- genes_tsv$V2
colnames(mat) <- barcodes_tsv$V1
cat("  Loaded:", nrow(mat), "genes x", ncol(mat), "cells\n\n")

#compute gene to ipn Mapping
gene_ipn_list <- lapply(rownames(mat), function(gene) {
  expressing_cells <- colnames(mat)[mat[gene, ] > 0]
  if (length(expressing_cells) == 0) return(NULL)
  
  cell_ipn <- ipn[ipn$cell_barcode %in% expressing_cells, ]
  if (nrow(cell_ipn) == 0) return(NULL)
  
  counts <- as.data.frame(table(cell_ipn$IPN_domain))
  colnames(counts) <- c("IPN_domain", "n_cells")
  counts$gene <- gene
  counts$total_expressing <- sum(counts$n_cells)
  counts$percent <- round(100 * counts$n_cells / counts$total_expressing, 1)
  
  counts[, c("gene", "IPN_domain", "n_cells", "total_expressing", "percent")]
})

gene_to_IPN_summary <- bind_rows(gene_ipn_list)
write.csv(gene_to_IPN_summary, "gene_to_IPN_summary.csv", row.names = FALSE)
cat("  Saved: gene_to_IPN_summary.csv (", nrow(gene_to_IPN_summary), " rows)\n\n")

#compute Dominant IPN per Gene
gene_dominant_IPN <- gene_to_IPN_summary %>%
  group_by(gene) %>%
  slice_max(percent, n = 1, with_ties = FALSE) %>%
  select(gene, dominant_IPN = IPN_domain, percent, total_expressing) %>%
  arrange(gene) %>%
  ungroup()

write.csv(gene_dominant_IPN, "gene_dominant_IPN.csv", row.names = FALSE)
cat("  Saved: gene_dominant_IPN.csv (", nrow(gene_dominant_IPN), " genes)\n\n")

#compute cluster to IPN Mapping

# Get cluster assignments
clusters <- data.frame(
  cell_barcode = names(hb_lar1_renamed@active.ident),
  cluster = as.character(hb_lar1_renamed@active.ident)
)

# Merge with IPN predictions
cluster_ipn <- merge(clusters, ipn, by = "cell_barcode")

# Calculate distribution per cluster
cluster_to_IPN_summary <- cluster_ipn %>%
  group_by(cluster, IPN_domain) %>%
  summarise(n_cells = n(), .groups = "drop") %>%
  group_by(cluster) %>%
  mutate(
    total_cells = sum(n_cells),
    percent = round(100 * n_cells / total_cells, 1)
  ) %>%
  ungroup()

write.csv(cluster_to_IPN_summary, "cluster_to_IPN_summary.csv", row.names = FALSE)
cat("  Saved: cluster_to_IPN_summary.csv (", nrow(cluster_to_IPN_summary), " rows)\n")

# Dominant IPN per cluster
cluster_dominant_IPN <- cluster_to_IPN_summary %>%
  group_by(cluster) %>%
  slice_max(percent, n = 1, with_ties = FALSE) %>%
  select(cluster, dominant_IPN = IPN_domain, percent, total_cells) %>%
  ungroup()

write.csv(cluster_dominant_IPN, "cluster_dominant_IPN.csv", row.names = FALSE)
cat("  Saved: cluster_dominant_IPN.csv (", nrow(cluster_dominant_IPN), " clusters)\n\n")


