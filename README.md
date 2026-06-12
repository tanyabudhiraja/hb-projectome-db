# Zebrafish dHb-IPN Projectome Database

Interactive web database mapping transcriptomic neuronal clusters in the zebrafish dorsal habenula (dHb) to their predicted axonal projection targets in the interpeduncular nucleus (IPN).

**Live site:** [https://rcweb.dartmouth.edu/HalpernLab/](https://rcweb.dartmouth.edu/HalpernLab/)

## About

This database allows users to:
- Look up which IPN subdomain a dHb transcriptomic cluster projects to
- Reverse lookup: find which clusters project to a given IPN subdomain
- Search gene expression patterns across dHb neurons
- Visualize gene expression on UMAP embeddings
- Download data tables as CSV

## Data Sources

- **Single-cell RNA-seq data:** Pandey et al. (2018). Comprehensive Identification and Spatial Mapping of Habenular Neuronal Types Using Single-Cell RNA-Seq. *Current Biology*, 28(7), 1052–1065.
- **Analysis pipeline:** Ji Cheng, Halpern Lab

## IPN Subdomains

| Domain | Name | Full Name | Cholinergic |
|--------|------|-----------|-------------|
| Di | Dorsal i | Dorsal IPN, subdomain i | No |
| Dii | Dorsal ii | Dorsal IPN, subdomain ii | No |
| I | Intermediate | Intermediate IPN | No |
| Vi | Ventral i | Ventral IPN, subdomain i | Yes |
| Vii | Ventral ii | Ventral IPN, subdomain ii | Yes |
| Viii | Ventral iii | Ventral IPN, subdomain iii | Yes |

## Repository Structure

```
├── index.html              # Main webpage
├── app.js                  # Interactive functionality
├── gene_data/              # Gene expression CSVs (22,372 genes)
├── gene_list.csv           # List of available genes
├── cluster_dominant_IPN.csv    # Cluster → IPN mapping
├── cluster_to_IPN_summary.csv  # Full cluster-IPN distribution
├── gene_dominant_IPN.csv       # Gene → IPN mapping
├── gene_to_IPN_summary.csv     # Full gene-IPN distribution
├── umap_coordinates.csv        # UMAP embedding coordinates
├── predict_IPN_idents.csv      # IPN predictions per cell
├── generate_web_data.R         # Script to generate web data from Seurat object
├── gen_new_genes.Rmd           # Script to regenerate gene_data from raw 10X
├── hb_scseq_reanalysis_v2.Rmd  # Main analysis pipeline
├── larva.png, adult.png, dHb_clusters.png  # Images
└── README.md
```

## Regenerating Gene Data

If you need to regenerate the gene expression files from raw data:

1. Download the `lar1/` folder (10X Genomics output) from the lab shared drive
2. Run `gen_new_genes.Rmd` in RStudio
3. This generates `gene_data_new/` with CSVs for all genes

## Local Development

To run locally:

```bash
cd hb-projectome-db
python3 -m http.server 8000
# Open http://localhost:8000
```

## Credits

**Halpern Lab**  
Department of Molecular and Systems Biology  
Geisel School of Medicine at Dartmouth

- Analysis: Ji Cheng
- Web development: Tanya Budhiraja
- PI: Dr. Marnie Halpern
