# Zebrafish dHb-IPN Projectome Database

An interactive web database mapping transcriptomic neuronal clusters and gene expression patterns in the zebrafish dorsal habenula (dHb) to predicted axonal projection targets in the interpeduncular nucleus (IPN).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [IPN Subdomains](#ipn-subdomains)
- [Repository Structure](#repository-structure)
- [Data Files](#data-files)
- [Installation](#installation)
- [Usage](#usage)
- [Citation](#citation)

---

## Overview

This database integrates single-cell RNA sequencing data from the zebrafish dorsal habenula with machine learning-based predictions of axonal projection targets. The original scRNA-seq data is from:

> Pandey S, et al. (2018). Comprehensive identification and spatial mapping of habenular neuronal types using single-cell RNA-seq. *Current Biology*, 28(7), 1052-1065.

---

## Features

| **Cluster -> IPN Lookup** | Select a cluster to see which IPN subdomain it projects to |
| **IPN -> Clusters Lookup** | Select an IPN domain to see which clusters project there |
| **Gene -> IPN Lookup** | Search any gene to see IPN projection patterns |
| **IPN -> Genes Lookup** | Select an IPN domain to see enriched genes |
| **UMAP Explorer** | Interactive visualization colored by cluster, IPN, or gene expression |
| **Data Tables** | Searchable, paginated tables for clusters and genes |
| **Downloads** | Export plots and data as PNG/CSV |

---

## IPN Subdomains

| **Di** | Dorsal IPN, subdomain i | Non-cholinergic |
| **Dii** | Dorsal IPN, subdomain ii | Non-cholinergic |
| **I** | Intermediate IPN | Non-cholinergic |
| **Vi** | Ventral IPN, subdomain i | Cholinergic |
| **Vii** | Ventral IPN, subdomain ii | Cholinergic |
| **Viii** | Ventral IPN, subdomain iii | Cholinergic |

---

## Repository Structure

```
hb-projectome-db/
│
├── index.html                  # Main web application page
├── app.js                      # JavaScript application logic
├── .gitignore                  # Git ignore rules
│
├── gene_data/                  # Gene expression files (~14,691 files)
│   ├── SLC5A7A.csv
│   ├── KCTD12.2.csv
│   └── ...
│
├── cluster_dominant_IPN.csv    # Dominant IPN target per cluster
├── cluster_to_IPN_summary.csv  # Full cluster-IPN distribution
├── gene_dominant_IPN.csv       # Dominant IPN target per gene
├── gene_to_IPN_summary.csv     # Full gene-IPN distribution
├── gene_list.csv               # List of all genes
├── umap_coordinates.csv        # UMAP coordinates + metadata
├── predict_IPN_idents.csv      # XGBoost IPN predictions
├── dHb_clusters.png            # Static UMAP cluster image
│
├── generate_web_data.R         # R script to generate data files
└── hb_scseq_reanalysis_v2.Rmd  # Seurat analysis pipeline
```

---

## Data Files

### Web Application Files

| `index.html` | Main HTML page with UI structure and styling |
| `app.js` | JavaScript code for data loading, visualization, and interactivity |

### CSV Data Files

| `cluster_dominant_IPN.csv` | Dominant IPN target for each of 14 clusters | 
| `cluster_to_IPN_summary.csv` | Full distribution of each cluster across IPN domains | 
| `gene_dominant_IPN.csv` | Dominant IPN target for each gene |
| `gene_to_IPN_summary.csv` | Full distribution of each gene across IPN domains | 
| `gene_list.csv` | List of all 14,691 genes | 
| `umap_coordinates.csv` | UMAP embeddings with cluster and IPN labels |
| `predict_IPN_idents.csv` | XGBoost predictions for each cell | 

### Gene Expression Files

| `gene_data/` | Contains ~14,691 individual CSV files, one per gene. Each file has columns: `cell_barcode`, `expression` |

### Analysis Scripts

| `generate_web_data.R` | R script that exports all CSV files from the Seurat object |
| `hb_scseq_reanalysis_v2.Rmd` | Full Seurat analysis pipeline (clustering, UMAP, XGBoost) | Written by Ji Cheng |



## Installation

### Run Locally

```bash
# Clone the repository
git clone https://github.com/tanyabudhiraja/hb-projectome-db.git
cd hb-projectome-db

# Start local server
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

### Reproduce the Analysis

1. Download raw data from [GEO GSE137478](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE137478)
2. Run `hb_scseq_reanalysis_v2.Rmd` in RStudio
3. Run `generate_web_data.R` to export CSV files

#### Requirements
- R ≥ 4.0
- Seurat ≥ 5.0
- dplyr, Matrix, xgboost

---

## Usage

### UMAP Gene Expression

1. Navigate to **UMAP Explorer**
2. Select **Gene Expression** from the dropdown
3. Type a gene name (e.g., `SLC5A7A`) and press Enter
4. Points are colored by expression level (gray → red)

### Lookup Tables

1. Navigate to **Cluster Mapping** or **Gene Mapping**
2. Use the search box to filter
3. Click any row to view details

---

## Citation

```
Pandey S, et al. (2018). Comprehensive identification and spatial mapping of 
habenular neuronal types using single-cell RNA-seq. Current Biology, 28(7), 1052-1065.
```

