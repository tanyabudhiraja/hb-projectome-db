// ============================================================
// Zebrafish dHb-IPN Projectome Database - JavaScript
// ============================================================

// IPN Domain Info with publication colors
const ipnDomainInfo = {
    1: { code: "Di", fullName: "Dorsal IPN, subdomain i", color: "#C1514A" },      // Dark red/brick
    2: { code: "Dii", fullName: "Dorsal IPN, subdomain ii", color: "#E8C547" },    // Yellow/gold
    3: { code: "I", fullName: "Intermediate IPN", color: "#808080" },              // Gray
    4: { code: "Vi", fullName: "Ventral IPN, subdomain i", color: "#90C468" },     // Green
    5: { code: "Vii", fullName: "Ventral IPN, subdomain ii", color: "#5DADE2" },   // Blue/cyan
    6: { code: "Viii", fullName: "Ventral IPN, subdomain iii", color: "#9B7EBD" }  // Purple
};

// Cluster colors from Sankey diagram
const clusterColors = [
    "#C1514A",  // Cluster 1 - Dark red
    "#E89C47",  // Cluster 2 - Orange
    "#C9A942",  // Cluster 3 - Mustard/gold
    "#A8B55C",  // Cluster 4 - Olive green
    "#6EB859",  // Cluster 5 - Green
    "#4FA65A",  // Cluster 6 - Forest green
    "#4B9B99",  // Cluster 7 - Teal
    "#5FB8D4",  // Cluster 8 - Light blue/cyan
    "#5DADE2",  // Cluster 9 - Blue
    "#7BA3D4",  // Cluster 10 - Medium blue
    "#9B8BC7",  // Cluster 11 - Light purple
    "#B88BA8",  // Cluster 12 - Mauve
    "#C17BA3",  // Cluster 13 - Dusty rose
    "#4A4A4A"   // Cluster 14 - Dark gray
];

// Data storage
let clusterData = [];
let clusterDistData = [];
let geneData = [];
let geneDistData = [];
let umapData = [];
let geneList = [];

// Pagination
let geneTablePage = 1;
const genesPerPage = 50;
let filteredGeneData = [];

// ============================================================
// Tab Navigation
// ============================================================
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    // Load UMAP if switching to visualization tab
    if (tabId === 'umap-viz' && umapData.length > 0) {
        renderUMAP();
    }
}

// ============================================================
// Data Loading
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    // Load cluster dominant IPN
    fetch('cluster_dominant_IPN.csv')
        .then(r => r.text())
        .then(csv => {
            clusterData = Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
            populateClusterDropdown();
            populateClusterTable();
        })
        .catch(e => console.log('cluster_dominant_IPN.csv not found'));
    
    // Load cluster distribution
    fetch('cluster_to_IPN_summary.csv')
        .then(r => r.text())
        .then(csv => {
            clusterDistData = Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
        })
        .catch(e => console.log('cluster_to_IPN_summary.csv not found'));
    
    // Load gene dominant IPN
    fetch('gene_dominant_IPN.csv')
        .then(r => r.text())
        .then(csv => {
            geneData = Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
            filteredGeneData = [...geneData];
            populateGeneDatalist();
            populateGeneTable();
        })
        .catch(e => console.log('gene_dominant_IPN.csv not found'));
    
    // Load gene distribution
    fetch('gene_to_IPN_summary.csv')
        .then(r => r.text())
        .then(csv => {
            geneDistData = Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
        })
        .catch(e => console.log('gene_to_IPN_summary.csv not found'));
    
    // Load UMAP coordinates
    fetch('umap_coordinates.csv')
        .then(r => r.text())
        .then(csv => {
            umapData = Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
            renderUMAP('cluster'); // Show clusters by default on load
        })
        .catch(e => {
            document.getElementById('umapPlot').innerHTML = '<div class="loading">UMAP data not available. Run generate_web_data.R to create umap_coordinates.csv</div>';
        });
    
    // Load gene list
    fetch('gene_list.csv')
        .then(r => r.text())
        .then(csv => {
            const parsed = Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
            geneList = parsed.map(r => r.gene).filter(g => g);
            
            // Initialize custom autocomplete for gene search inputs
            const geneSearchInput = document.getElementById('geneSearchInput');
            const umapGeneInput = document.getElementById('umapGeneInput');
            
            if (geneSearchInput) {
                createAutocompleteDropdown(geneSearchInput, geneList);
            }
            if (umapGeneInput) {
                createAutocompleteDropdown(umapGeneInput, geneList);
            }
        })
        .catch(e => console.log('gene_list.csv not found'));
});

// ============================================================
// Dropdown Population
// ============================================================
function populateClusterDropdown() {
    const select = document.getElementById('clusterSelect');
    const sorted = [...clusterData].sort((a, b) => {
        const numA = parseInt(a.cluster.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.cluster.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });
    
    sorted.forEach(row => {
        const opt = document.createElement('option');
        opt.value = row.cluster;
        opt.textContent = `${row.cluster} (${row.total_cells} cells)`;
        select.appendChild(opt);
    });
}

// Custom autocomplete dropdown functionality
function createAutocompleteDropdown(inputElement, suggestions) {
    let currentFocus = -1;
    let autocompleteList;

    // Close any already open dropdown
    function closeAllLists(element) {
        const items = document.getElementsByClassName('autocomplete-items');
        for (let i = 0; i < items.length; i++) {
            if (element !== items[i] && element !== inputElement) {
                items[i].parentNode.removeChild(items[i]);
            }
        }
    }

    // Show dropdown with matches
    function showMatches(val) {
        closeAllLists();
        currentFocus = -1;
        
        if (!val || val.length < 1) return false;
        
        // Create dropdown container
        autocompleteList = document.createElement('div');
        autocompleteList.setAttribute('id', inputElement.id + 'autocomplete-list');
        autocompleteList.setAttribute('class', 'autocomplete-items');
        inputElement.parentNode.appendChild(autocompleteList);
        
        // Find matching genes (substring match, case-insensitive)
        const matches = suggestions.filter(gene => 
            gene.toUpperCase().includes(val.toUpperCase())
        ).slice(0, 15); // Limit to 15 suggestions
        
        if (matches.length === 0) {
            const noMatch = document.createElement('div');
            noMatch.innerHTML = '<em>No matching genes found</em>';
            noMatch.style.fontStyle = 'italic';
            noMatch.style.color = '#666';
            autocompleteList.appendChild(noMatch);
            return;
        }
        
        // Create dropdown items
        matches.forEach(gene => {
            const item = document.createElement('div');
            const index = gene.toUpperCase().indexOf(val.toUpperCase());
            
            // Highlight matching part
            item.innerHTML = gene.substr(0, index);
            item.innerHTML += '<strong>' + gene.substr(index, val.length) + '</strong>';
            item.innerHTML += gene.substr(index + val.length);
            
            // Store the full gene name
            item.innerHTML += '<input type="hidden" value="' + gene + '">';
            
            // Click handler
            item.addEventListener('click', function(e) {
                inputElement.value = this.getElementsByTagName('input')[0].value;
                closeAllLists();
                // Trigger the gene search
                if (inputElement.id === 'geneSearchInput') {
                    showGeneResult(inputElement.value);
                } else if (inputElement.id === 'umapGeneInput') {
                    // Trigger UMAP load
                    const geneName = inputElement.value.trim();
                    if (geneName) {
                        document.getElementById('umapPlot').innerHTML = '<div class="loading">Loading gene expression...</div>';
                        loadGeneExpression(geneName).then(expr => {
                            if (expr) {
                                renderUMAP('gene', expr);
                            } else {
                                document.getElementById('umapPlot').innerHTML = '<div class="loading">Gene not found</div>';
                            }
                        });
                    }
                }
            });
            
            autocompleteList.appendChild(item);
        });
    }

    // Handle input event - show dropdown immediately
    inputElement.addEventListener('input', function(e) {
        showMatches(this.value);
    });

    // Keyboard navigation
    inputElement.addEventListener('keydown', function(e) {
        let items = document.getElementById(this.id + 'autocomplete-list');
        if (items) items = items.getElementsByTagName('div');
        
        if (e.keyCode === 40) { // Down arrow
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.keyCode === 38) { // Up arrow
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.keyCode === 13) { // Enter
            if (currentFocus > -1 && items && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.keyCode === 27) { // Escape
            closeAllLists();
        }
    });

    function addActive(items) {
        if (!items) return false;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        if (items[currentFocus]) {
            items[currentFocus].classList.add('autocomplete-active');
        }
    }

    function removeActive(items) {
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('autocomplete-active');
        }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
    
    // Show dropdown on focus if there's already text
    inputElement.addEventListener('focus', function() {
        if (this.value.length >= 1) {
            showMatches(this.value);
        }
    });
}

function populateUmapGeneDatalist() {
    const datalist = document.getElementById('umapGeneDatalist');
    geneList.slice(0, 500).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        datalist.appendChild(opt);
    });
}

// ============================================================
// Table Population
// ============================================================
function populateClusterTable() {
    const tbody = document.querySelector('#clusterDataTable tbody');
    const sorted = [...clusterData].sort((a, b) => {
        const numA = parseInt(a.cluster.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.cluster.match(/\d+/)?.[0] || 0);
        return numA - numB;
    });
    
    sorted.forEach(row => {
        const tr = document.createElement('tr');
        const dom = ipnDomainInfo[parseInt(row.dominant_IPN)];
        tr.innerHTML = `
            <td>${row.cluster}</td>
            <td>${dom ? dom.code : row.dominant_IPN}</td>
            <td>${parseFloat(row.percent).toFixed(1)}%</td>
            <td>${row.total_cells}</td>
        `;
        tr.onclick = () => {
            document.getElementById('clusterSelect').value = row.cluster;
            showClusterResult(row.cluster);
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.nav-item')[2].classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('cluster-lookup').classList.add('active');
        };
        tbody.appendChild(tr);
    });
}

function populateGeneTable() {
    const tbody = document.querySelector('#geneDataTable tbody');
    tbody.innerHTML = '';
    
    const start = (geneTablePage - 1) * genesPerPage;
    const pageData = filteredGeneData.slice(start, start + genesPerPage);
    
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        const dom = ipnDomainInfo[parseInt(row.dominant_IPN)];
        tr.innerHTML = `
            <td>${row.gene}</td>
            <td>${dom ? dom.code : row.dominant_IPN}</td>
            <td>${parseFloat(row.percent).toFixed(1)}%</td>
            <td>${row.total_expressing}</td>
        `;
        tr.onclick = () => viewGeneOnUMAP(row.gene);
        tbody.appendChild(tr);
    });
    
    const totalPages = Math.ceil(filteredGeneData.length / genesPerPage);
    document.getElementById('genePageInfo').textContent = `Page ${geneTablePage} of ${totalPages}`;
    document.getElementById('genePrevBtn').disabled = geneTablePage <= 1;
    document.getElementById('geneNextBtn').disabled = geneTablePage >= totalPages;
}

function changeGenePage(delta) {
    const totalPages = Math.ceil(filteredGeneData.length / genesPerPage);
    geneTablePage = Math.max(1, Math.min(totalPages, geneTablePage + delta));
    populateGeneTable();
}

// ============================================================
// Result Display Functions
// ============================================================
function showClusterResult(clusterName) {
    const resultDiv = document.getElementById('clusterResult');
    if (!clusterName) { resultDiv.classList.remove('visible'); return; }
    
    const cluster = clusterData.find(r => r.cluster === clusterName);
    const dist = clusterDistData.filter(r => r.cluster === clusterName);
    
    if (cluster) {
        const dom = ipnDomainInfo[parseInt(cluster.dominant_IPN)];
        let distBar = createDistributionBar(dist);
        
        resultDiv.innerHTML = `
            <h3>${cluster.cluster}</h3>
            <p><strong>major target:</strong> ${dom.fullName} (${dom.code})</p>
            <p><strong>Percentage:</strong> ${parseFloat(cluster.percent).toFixed(1)}% project to ${dom.code}</p>
            <p><strong>Total cells:</strong> ${cluster.total_cells}</p>
            ${distBar ? '<h4>Full Distribution:</h4>' + distBar : ''}
            <button class="btn" onclick="viewClusterOnUMAP('${clusterName}')">View on UMAP</button>
        `;
        resultDiv.classList.add('visible');
    }
}

function showIPNResult(ipnNum) {
    const resultDiv = document.getElementById('ipnResult');
    if (!ipnNum) { resultDiv.classList.remove('visible'); return; }
    
    const dom = ipnDomainInfo[ipnNum];
    const matches = clusterData.filter(r => parseInt(r.dominant_IPN) === parseInt(ipnNum))
        .sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));

    let html = `<h3>${dom.fullName} (${dom.code})</h3>`;

    if (matches.length === 0) {
        html += '<p>No clusters have this as their major target.</p>';
    } else {
        html += `<p><strong>Clusters (${matches.length}):</strong></p><div class="item-list">`;
        matches.forEach(c => {
            html += `<div class="list-item" onclick="viewClusterOnUMAP('${c.cluster}')"><span><strong>${c.cluster}</strong></span><span>${parseFloat(c.percent).toFixed(1)}% - ${c.total_cells} cells</span></div>`;
        });
        html += '</div>';
    }
    
    resultDiv.innerHTML = html;
    resultDiv.classList.add('visible');
}

function showGeneResult(geneName) {
    const resultDiv = document.getElementById('geneResult');
    if (!geneName) { resultDiv.classList.remove('visible'); return; }
    
    const gene = geneData.find(r => r.gene.toUpperCase() === geneName.toUpperCase());
    const dist = geneDistData.filter(r => r.gene.toUpperCase() === geneName.toUpperCase());
    
    if (!gene) {
        resultDiv.innerHTML = `<h3>Gene not found</h3><p>No data for "${geneName}".</p>`;
        resultDiv.classList.add('visible');
        return;
    }
    
    const dom = ipnDomainInfo[parseInt(gene.dominant_IPN)];
    let distBar = createDistributionBar(dist);
    
    resultDiv.innerHTML = `
        <h3>${gene.gene}</h3>
        <p><strong>major target:</strong> ${dom.fullName} (${dom.code})</p>
        <p><strong>Percentage:</strong> ${parseFloat(gene.percent).toFixed(1)}% of expressing cells</p>
        <p><strong>Expressing cells:</strong> ${gene.total_expressing}</p>
        ${distBar ? '<h4>IPN Distribution:</h4>' + distBar : ''}
        <button class="btn" onclick="viewGeneOnUMAP('${gene.gene}')">View on UMAP</button>
    `;
    resultDiv.classList.add('visible');
}

function showIPNGeneResult(ipnNum) {
    const resultDiv = document.getElementById('ipnGeneResult');
    if (!ipnNum) { resultDiv.classList.remove('visible'); return; }
    
    const dom = ipnDomainInfo[ipnNum];
    const matches = geneData.filter(r => parseInt(r.dominant_IPN) === parseInt(ipnNum))
        .sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent))
        .slice(0, 50);

    let html = `<h3>${dom.fullName} (${dom.code})</h3>`;

    if (matches.length === 0) {
        html += '<p>No genes have this as their major target.</p>';
    } else {
        const total = geneData.filter(r => parseInt(r.dominant_IPN) === parseInt(ipnNum)).length;
        html += `<p><strong>Top genes (${matches.length} of ${total}):</strong></p><div class="item-list">`;
        matches.forEach(g => {
            html += `<div class="list-item" onclick="viewGeneOnUMAP('${g.gene}')"><span><strong>${g.gene}</strong></span><span>${parseFloat(g.percent).toFixed(1)}% - ${g.total_expressing} cells</span></div>`;
        });
        html += '</div>';
    }
    
    resultDiv.innerHTML = html;
    resultDiv.classList.add('visible');
}

function createDistributionBar(dist) {
    if (!dist || dist.length === 0) return '';
    
    let distBar = '<div class="distribution-bar">';
    let distLabels = '<div style="display: flex; margin-top: 5px; font-size: 0.85em; color: #666;">';
    
    dist.sort((a, b) => parseInt(a.IPN_domain) - parseInt(b.IPN_domain));
    dist.forEach(d => {
        const pct = parseFloat(d.percent);
        const info = ipnDomainInfo[parseInt(d.IPN_domain)];
        if (pct > 2 && info) {
            distBar += `<div class="distribution-segment" style="width:${pct}%;background:${info.color}" title="${info.code}: ${pct.toFixed(1)}%">${info.code}</div>`;
            distLabels += `<div style="width:${pct}%;text-align:center;">${pct.toFixed(1)}%</div>`;
        }
    });
    distBar += '</div>';
    distLabels += '</div>';
    
    return distBar + distLabels;
}

// ============================================================
// UMAP Visualization
// ============================================================
function renderUMAP(colorBy = 'cluster', geneExpr = null) {
    if (umapData.length === 0) return;
    
    let traces = [];
    
    if (colorBy === 'cluster') {
        // Group by cluster
        const clusters = [...new Set(umapData.map(d => d.cluster))].sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
        });
        
        clusters.forEach((cluster, i) => {
            const cells = umapData.filter(d => d.cluster === cluster);
            traces.push({
                x: cells.map(d => parseFloat(d.UMAP_1)),
                y: cells.map(d => parseFloat(d.UMAP_2)),
                mode: 'markers',
                type: 'scattergl',
                name: cluster,
                marker: {
                    size: 4,
                    color: clusterColors[i % clusterColors.length],
                    opacity: 0.7
                },
                text: cells.map(d => `${d.cluster}<br>IPN: ${ipnDomainInfo[d.IPN_domain]?.code || d.IPN_domain}`),
                hoverinfo: 'text'
            });
        });
    } else if (colorBy === 'ipn') {
        // Group by IPN domain
        const domains = [1, 2, 3, 4, 5, 6];
        
        domains.forEach(ipn => {
            const cells = umapData.filter(d => parseInt(d.IPN_domain) === ipn);
            const info = ipnDomainInfo[ipn];
            traces.push({
                x: cells.map(d => parseFloat(d.UMAP_1)),
                y: cells.map(d => parseFloat(d.UMAP_2)),
                mode: 'markers',
                type: 'scattergl',
                name: `${info.code}`,
                marker: {
                    size: 4,
                    color: info.color,
                    opacity: 0.7
                },
                text: cells.map(d => `${d.cluster}<br>IPN: ${info.code}`),
                hoverinfo: 'text'
            });
        });
    } else if (colorBy === 'gene' && geneExpr) {
        // Single trace with expression color scale
        const exprMap = {};
        geneExpr.forEach(d => { exprMap[d.cell_barcode] = parseFloat(d.expression) || 0; });
        
        const x = [], y = [], colors = [], text = [];
        umapData.forEach(d => {
            x.push(parseFloat(d.UMAP_1));
            y.push(parseFloat(d.UMAP_2));
            const expr = exprMap[d.cell_barcode] || 0;
            colors.push(expr);
            text.push(`${d.cluster}<br>IPN: ${ipnDomainInfo[d.IPN_domain]?.code}<br>Expr: ${expr.toFixed(2)}`);
        });
        
        traces.push({
            x: x,
            y: y,
            mode: 'markers',
            type: 'scattergl',
            marker: {
                size: 4,
                color: colors,
                colorscale: [
                    [0, '#f0f0f0'],
                    [0.25, '#fee0d2'],
                    [0.5, '#fc9272'],
                    [0.75, '#de2d26'],
                    [1, '#67000d']
                ],
                colorbar: {
                    title: 'Expression',
                    thickness: 15
                },
                opacity: 0.8
            },
            text: text,
            hoverinfo: 'text'
        });
    }
    
    const layout = {
        title: colorBy === 'gene' ? `Gene Expression: ${document.getElementById('umapGeneInput').value}` : '',
        xaxis: { title: 'UMAP_1', zeroline: false },
        yaxis: { title: 'UMAP_2', zeroline: false },
        hovermode: 'closest',
        legend: { orientation: 'v', x: 1.02, y: 1 },
        margin: { l: 60, r: 150, t: 40, b: 60 }
    };
    
    Plotly.newPlot('umapPlot', traces, layout, { responsive: true });
}

async function loadGeneExpression(geneName) {
    const safeName = geneName.replace(/[^A-Za-z0-9._-]/g, '_');
    try {
        const response = await fetch(`gene_data/${safeName}.csv`);
        if (!response.ok) throw new Error('Gene not found');
        const csv = await response.text();
        return Papa.parse(csv, {header: true, skipEmptyLines: true}).data;
    } catch (e) {
        console.log('Gene expression file not found:', safeName);
        return null;
    }
}

function viewGeneOnUMAP(geneName) {
    document.getElementById('umapColorSelect').value = 'gene';
    document.getElementById('geneSelectContainer').style.display = 'block';
    document.getElementById('umapGeneInput').value = geneName;
    
    // Switch to UMAP tab
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-item')[6].classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('umap-viz').classList.add('active');
    
    // Load and render
    document.getElementById('umapPlot').innerHTML = '<div class="loading">Loading gene expression...</div>';
    loadGeneExpression(geneName).then(expr => {
        if (expr) {
            renderUMAP('gene', expr);
        } else {
            document.getElementById('umapPlot').innerHTML = '<div class="loading">Gene expression data not found</div>';
        }
    });
}

function viewClusterOnUMAP(clusterName) {
    document.getElementById('umapColorSelect').value = 'cluster';
    document.getElementById('geneSelectContainer').style.display = 'none';
    
    // Switch to UMAP tab
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-item')[6].classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('umap-viz').classList.add('active');
    
    renderUMAP('cluster');
}

// ============================================================
// Download Functions
// ============================================================
function downloadCSV(filename) {
    const link = document.createElement('a');
    link.href = filename;
    link.download = filename;
    link.click();
}

function downloadPlot() {
    Plotly.downloadImage('umapPlot', {
        format: 'png',
        width: 1200,
        height: 800,
        filename: 'umap_plot'
    });
}

// ============================================================
// Event Listeners  
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const clusterSelect = document.getElementById('clusterSelect');
    if (clusterSelect) {
        clusterSelect.addEventListener('change', function() {
            showClusterResult(this.value);
        });
    }

    const ipnSelect = document.getElementById('ipnSelect');
    if (ipnSelect) {
        ipnSelect.addEventListener('change', function() {
            showIPNResult(this.value);
        });
    }

    const geneSearchInput = document.getElementById('geneSearchInput');
    if (geneSearchInput) {
        geneSearchInput.addEventListener('input', function() {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                if (this.value.length >= 2) showGeneResult(this.value);
            }, 300);
        });
    }

    const ipnGeneSelect = document.getElementById('ipnGeneSelect');
    if (ipnGeneSelect) {
        ipnGeneSelect.addEventListener('change', function() {
            showIPNGeneResult(this.value);
        });
    }

    const geneTableFilter = document.getElementById('geneTableFilter');
    if (geneTableFilter) {
        geneTableFilter.addEventListener('input', function() {
            const filter = this.value.toLowerCase();
            filteredGeneData = filter ? geneData.filter(r => r.gene.toLowerCase().includes(filter)) : [...geneData];
            geneTablePage = 1;
            populateGeneTable();
        });
    }

    const umapGeneInput = document.getElementById('umapGeneInput');
    if (umapGeneInput) {
        umapGeneInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const geneName = this.value.trim();
                if (geneName) {
                    document.getElementById('umapPlot').innerHTML = '<div class="loading">Loading gene expression...</div>';
                    loadGeneExpression(geneName).then(expr => {
                        if (expr) {
                            renderUMAP('gene', expr);
                        } else {
                            document.getElementById('umapPlot').innerHTML = '<div class="loading">Gene expression data not found. Check gene name or run generate_web_data.R</div>';
                        }
                    });
                }
            }
        });
    }
});