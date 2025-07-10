import { Component, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { DataService } from "src/app/services/data.service"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"

const VENDOR_MAP: Record<string, string> = {
  "fe85da04-2d40-40eb-86f5-682fde6f9573": "Novacom",
  "c257ad68-2390-425a-9946-f800c48fe8c4": "Geek",
  "8014a694-842d-48fd-9c4d-dc32cf15fb93": "Global-Tech",
  "fe2f623f-1900-431f-8684-7659e180a207": "Netis",
  "3aed5813-e6a8-4670-b1f0-775aa4fbe9be": "EastCastle",
  // Ajoute ici les autres VendorId connus :
  // 'xxxx-xxxx': 'ATC',
  // 'yyyy-yyyy': 'IHS',
  // etc.
}

interface Report {
  report?: {
    id?: string
    vendorId?: string
    site?: {
      name?: string
      siteId?: string
      province?: string
      region?: string
      siteType?: string
      powerConfiguration?: string
      portfolio?: string
      tenantsNames?: string
      vendorId?: string
    }
    fme?: {
      fullName?: string
      vendorId?: string
    }
    fmeName?: string
    pmType?: string
    pmPlannedDate?: string
    pmActualDate?: string
    status?: string
    isSubmitted?: boolean
    submittedAt?: string
    validationComment?: string
    createdAt?: string
    updatedAt?: string
  }
  sections?: any[]
  [key: string]: any
}

@Component({
  selector: "app-all-reports",
  templateUrl: "./all-reports.component.html",
  styleUrls: ["./all-reports.component.css"],
})
export class AllReportsComponent implements OnInit {
  pagedReports: Report[] = []
  reportPagesCache: { [page: number]: Report[] } = {}
  excelData: Report[] = []
  excelLoading = false
  showSkeleton = true
  error: string | null = null

  currentUser: { role?: string; vendorId?: string; [key: string]: any } | null = null
  currentPage = 1
  itemsPerPage = 50
  totalPages = 1
  totalItems = 0
  searchTerm = ""
  statusFilter = ""
  filterStartDate: string | null = null
  filterEndDate: string | null = null
  currentFilters: any = {}
  initialLoading = true

  Math = Math

  constructor(private data: DataService, private router: Router) {}

  ngOnInit(): void {
    this.data.getCurrentUser().subscribe((user) => {
      this.currentUser = user
      if (!this.currentUser) {
        this.router.navigate(["/login"])
        return
      }
      this.loadReports(1)
    })
  }

  /** Chargement paginé avec cache mémoire */
  loadReports(page: number, filters: any = this.currentFilters): void {
    if (JSON.stringify(filters) !== JSON.stringify(this.currentFilters)) {
      this.reportPagesCache = {}
      this.currentFilters = { ...filters }
      this.excelData = []
    }
    if (this.reportPagesCache[page]) {
      this.pagedReports = this.reportPagesCache[page]
      this.currentPage = page
      this.showSkeleton = false
      return
    }
    this.showSkeleton = true
    this.data.getReportsPage(page, this.itemsPerPage, filters).subscribe({
      next: (res: any) => {
        this.pagedReports = res.data
        this.reportPagesCache[page] = res.data
        this.currentPage = page
        this.totalPages = res.totalPages
        this.totalItems = res.totalItems
        this.showSkeleton = false

        console.log('RESPONSE PAGED:', res.data);
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des rapports."
        this.showSkeleton = false
      }
    })
  }

  /** Pagination */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === -1) return
    this.loadReports(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /** Pagination intelligente pour le template */
  getVisiblePages(): number[] {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, this.currentPage - delta);
      i <= Math.min(this.totalPages - 1, this.currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (this.currentPage - delta > 2) {
      rangeWithDots.push(1, -1)
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (this.currentPage + delta < this.totalPages - 1) {
      rangeWithDots.push(-1, this.totalPages)
    } else if (this.totalPages > 1) {
      rangeWithDots.push(this.totalPages)
    }

    return rangeWithDots
  }

  /** Recherche et filtres (tout côté serveur) */
  applySearch(): void {
    this.currentFilters = {
      ...this.currentFilters,
      searchTerm: this.searchTerm,
      status: this.statusFilter,
      startDate: this.filterStartDate,
      endDate: this.filterEndDate,
    }
    this.reportPagesCache = {}
    this.excelData = []
    this.loadReports(1, this.currentFilters)
  }

  applyDateFilter(): void {
    this.applySearch()
  }

  resetFilter(): void {
    this.searchTerm = ""
    this.statusFilter = ""
    this.filterStartDate = null
    this.filterEndDate = null
    this.currentFilters = {}
    this.reportPagesCache = {}
    this.excelData = []
    this.loadReports(1)
  }

  applyStatusFilter(): void {
    this.applySearch()
  }

  /** Mapping vendorId -> nom du vendor, fallback sur portfolio */
 getVendorName(report: any): string {
  const site = report['site'];
  if (site?.vendorId && VENDOR_MAP[site.vendorId]) {
    return VENDOR_MAP[site.vendorId];
  }
  // Pour debug, tu peux voir la valeur en console si besoin :
  // console.log("Vendor ID inconnu ou non mappé :", site?.vendorId);
  return site?.portfolio || "N/A";
}


  getStatusBadgeClass(status: string | undefined): string {
    switch ((status || "").toLowerCase()) {
      case "closed":
      case "submitted":
      case "approved":
        return "badge bg-success"
      case "open":
      case "draft":
        return "badge bg-warning text-dark"
      case "rejected":
        return "badge bg-danger"
      default:
        return "badge bg-secondary"
    }
  }

  /** --- EXPORT EXCEL --- */
  exportExcel(): void {
    if (this.excelData.length === 0) {
      this.excelLoading = true
      this.data.getAllReportsDetails(this.currentFilters).subscribe({
        next: (allDetails: Report[]) => {
          this.excelData = allDetails
          this.excelLoading = false
          this.doExport(this.excelData)
        },
        error: () => {
          this.excelLoading = false
          this.error = "Erreur lors de la préparation Excel"
        }
      })
    } else {
      this.doExport(this.excelData)
    }
  }

  /** Toute ta logique de mapping/colonnes Excel */
  doExport(reports: Report[]): void {
    // === TOUT TON CODE METIER D'EXPORT ICI ===
    // (colle toute la partie de mapping dynamique que tu avais, rien à changer)
    // ⬇️
    // -----
    // --- ORDRE & MAPPING ---
   
    const SECTION_ORDER = [
      "Sécurité du site",
      "Générateur",
      "Charges AC du Site",
      "SMPS",
      "Batterie Backup (BBU)",
      "DC Box Orange",
      "DC Box Airtel",
      "DC Box Vodacom",
      "Infrastructure et Équipement du Tower (Pylon)",
      "Environnement du Site",
      "Fondation du Tower (Pylon)",
      "Commentaires",
    ]
    const SECTION_MAP: Record<string, string> = {
      "Sécurité du site": "Sécurité du site",
      "Site Security": "Sécurité du site",
      "Sécurité du Site": "Sécurité du site",
      "Vérification Visuelle de la Sécurité du Site": "Sécurité du site",
      "Site Security Visual Check": "Sécurité du site",
      Générateur: "Générateur",
      Generator: "Générateur",
      "Charges AC du Site": "Charges AC du Site",
      "Charge CC du Site": "Charges AC du Site",
      "Site DC Load": "Charges AC du Site",
      SMPS: "SMPS",
      "Batterie Backup (BBU)": "Batterie Backup (BBU)",
      "Battery Backup": "Batterie Backup (BBU)",
      "Batterie de Secours": "Batterie Backup (BBU)",
      "DC Box Orange": "DC Box Orange",
      "DC Box Airtel": "DC Box Airtel",
      "DC Box Vodacom": "DC Box Vodacom",
      "Infrastructure et Équipement du Tower (Pylon)": "Infrastructure et Équipement du Tower (Pylon)",
      "Infrastructure et Équipement de la Tour": "Infrastructure et Équipement du Tower (Pylon)",
      "Tower Infrastructure & Equipment": "Infrastructure et Équipement du Tower (Pylon)",
      "Environnement du Site": "Environnement du Site",
      "Site Environment": "Environnement du Site",
      "Fondation du Tower (Pylon)": "Fondation du Tower (Pylon)",
      "Fondations de la Tour": "Fondation du Tower (Pylon)",
      "Tower Foundations": "Fondation du Tower (Pylon)",
      "Dites nous tout ce que vous avez trouvé comme problèmes sur le site": "Commentaires",
      "Commentaires Généraux": "Commentaires",
      "General Comments": "Commentaires",
    }
    const ITEM_MAP: Record<string, Record<string, string>> = {
      "Sécurité du site": {
        "Quel est le statut de la clôture du site ?": "Statut de la clôture",
        "Gate Lock Status": "Statut de la clôture",
        "Quel type de Cadenas est sur la porte ?": "Type de Cadenas Porte",
        "Quel type de Cadenas est sur le Générateur ?": "Type de Cadenas Générateur",
        "Le générateur a une ceinture de securité ?": "Ceinture de sécurité Générateur",
        "Photo de la clôture du site": "Photo Clôture",
        "Photo de la Guérite du site": "Photo Guérite",
        "La cloture est construit avec quels types de matériaux ?": "Matériaux Clôture",
        "Quel est l'État de la balise d'aviation ?": "État Balise Aviation",
        "Vous avez des commentaires sur la sécurité du site ?": "Commentaires Sécurité",
      },
      Générateur: {
        "Modèle du Générateur": "Modèle du Générateur",
        "Generator Model": "Modèle du Générateur",
        "Capacité du Générateur": "Capacité du Générateur",
        "Generator Capacity": "Capacité du Générateur",
        "Numéro de Série": "Numéro de Série",
        "Serial Number": "Numéro de Série",
        "Quel est l'Index du Générateur ?": "Index du Générateur",
        "Generator Index": "Index du Générateur",
        "Le générateur est sur Dalle (Slab)?": "Sur Dalle (Slab)?",
        "Concrete Slab Present": "Sur Dalle (Slab)?",
        "Type de Batterie du Générateur": "Type de Batterie du Générateur",
        "DG Battery Type": "Type de Batterie du Générateur",
        "Automatism Status": "Automatisme fonctionne ?",
        "L'automatisme fonctionne ?": "Automatisme fonctionne ?",
        "Quels sont les problèmes que t'as rencontré ?": "Problèmes rencontrés",
        "Issues Encountered": "Problèmes rencontrés",
      },
      "Charges AC du Site": {
        "Quel est la Charge Totale du Site ?": "Charge Totale",
        "Quel est la Charge Orange": "Charge Orange",
        "Quel est la Charge Airtel": "Charge Airtel",
        "Quel est la Charge Vodacom": "Charge Vodacom",
      },
      SMPS: {
        "Quel est la Marque du SMPS": "Marque du SMPS",
        "SMPS Brand": "Marque du SMPS",
        "Quel est sa Capacité SMPS": "Capacité SMPS",
        "Combien des Modules Rectifier sont opérationnels ?": "Modules Rectifier opérationnels",
        "Combien des Modules Solaires Opérationnels (MPPT) ?": "Modules Solaires Opérationnels",
        "Combien des Modules Rectifiers sont abimés ?": "Modules Rectifiers abîmés",
        "Pourquoi les Modules Rectifiers sont abimés ?": "Cause Modules Rectifiers abîmés",
      },
      "Batterie Backup (BBU)": {
        "Quel est la Marque des BBU": "Marque BBU",
        "Si la marque n'est pas dans la liste, écrivez la marque": "Autre Marque BBU",
        "Quel est la Capacité BBU (AH)": "Capacité BBU",
        "Il y a combien des Batteries Backup ?": "Nombre Batteries Backup",
        "Est-ce que les bornes sont graissés ? (Uniquement les Lead Acid)": "Bornes Graissées",
      },
      "DC Box Orange": {
        "Model et taille du Dijoncteur 1 (Orange)": "Disjoncteur 1 Orange",
        "Model et taille du Dijoncteur 2 (Orange)": "Disjoncteur 2 Orange",
        "Model et taille du Dijoncteur 3 (Orange)": "Disjoncteur 3 Orange",
      },
      "DC Box Airtel": {
        "Model et taille du Dijoncteur 1 (Airtel)": "Disjoncteur 1 Airtel",
        "Model et taille du Dijoncteur 2 (Airtel)": "Disjoncteur 2 Airtel",
        "Model et taille du Dijoncteur 3 (Airtel)": "Disjoncteur 3 Airtel",
      },
      "DC Box Vodacom": {
        "Model et taille du Dijoncteur 1 (Vodacom)": "Disjoncteur 1 Vodacom",
        "Model et taille du Dijoncteur 2 (Vodacom)": "Disjoncteur 2 Vodacom",
        "Model et taille du Dijoncteur 3 (Vodacom)": "Disjoncteur 3 Vodacom",
      },
      "Infrastructure et Équipement du Tower (Pylon)": {
        "Quel est le Nombre d'Antennes GSM": "Nombre Antennes GSM",
        "Quel est le Nombre de Microwave": "Nombre Microwave",
        "Quel est le Nombre d'Unités RRU": "Nombre Unités RRU",
      },
      "Environnement du Site": {
        "Prenez plusieurs photos  de l'Environnement": "Photos Environnement",
      },
      "Fondation du Tower (Pylon)": {
        "Prenez une photo de chaque pieds des Pylon": "Photo Pieds Pylon",
      },
      Commentaires: {
        "Dites nous tout ce que vous avez trouvé comme problèmes sur le site": "Commentaires",
        "Commentaires Généraux": "Commentaires",
        "General Comments": "Commentaires",
      },
    }

    // 1. Collecte dynamique des colonnes
    const allSectionLabels: Record<string, Set<string>> = {}
    const allItemIdsByCol: Record<string, Set<string>> = {}

    reports.forEach((report) => {
      const sectionsArr: any[] = (report as any).sections || (report.report && (report.report as any).sections) || []
      sectionsArr.forEach((section: any) => {
        const sectionRaw = section.title || section.sectionType || "Section inconnue"
        const sectionNorm = SECTION_MAP[sectionRaw] || sectionRaw
        if (!allSectionLabels[sectionNorm]) allSectionLabels[sectionNorm] = new Set()
        ;(section.items || []).forEach((item: any) => {
          if (item.type !== "photo") {
            const labelRaw = item.label || item.type || "Item inconnu"
            const labelNorm = (ITEM_MAP[sectionNorm] && ITEM_MAP[sectionNorm][labelRaw]) || labelRaw
            const colKey = `${sectionNorm} - ${labelNorm}`
            allSectionLabels[sectionNorm].add(labelNorm)
            if (!allItemIdsByCol[colKey]) allItemIdsByCol[colKey] = new Set()
            allItemIdsByCol[colKey].add(item.id)
          }
        })
      })
    })

    // Ordre métier puis les autres
    const allSectionsOrdered = [
      ...SECTION_ORDER.filter((sec) => allSectionLabels[sec]),
      ...Object.keys(allSectionLabels).filter((sec) => !SECTION_ORDER.includes(sec)),
    ]
    const dynamicColumns: string[] = []
    allSectionsOrdered.forEach((section) => {
      Array.from(allSectionLabels[section])
        .sort()
        .forEach((label) => {
          dynamicColumns.push(`${section} - ${label}`)
        })
      dynamicColumns.push(`${section} - Autres`)
    })
    const infoColumns = [
      "Rapport ID", "Site", "Site ID", "Vendor", "Province", "Region", "Site Type",
      "Power Configuration", "Tenants", "FME", "PM Planned Date", "PM Actual Date", "Status", "Type PM",
    ]
    const columns = [...infoColumns, ...dynamicColumns]

    // 2. Génération des lignes
    const dataToExport: any[] = []

    reports.forEach((report) => {
      const base = report.report || {}
      const site = base.site || {}
      const fme = base.fme || {}
      const vendorName = this.getVendorName(report)
      const valuesArr: any[] = (report as any).values || (report.report && (report.report as any).values) || []
      const sectionsArr: any[] = (report as any).sections || (report.report && (report.report as any).sections) || []

      // Map itemId → value la plus récente
      const latestValuePerItem: Record<string, any> = {}
      valuesArr.forEach((v: any) => {
        if (
          !latestValuePerItem[v.reportItemId] ||
          (v.createdAt &&
            (!latestValuePerItem[v.reportItemId].createdAt ||
              new Date(v.createdAt) > new Date(latestValuePerItem[v.reportItemId].createdAt)))
        ) {
          latestValuePerItem[v.reportItemId] = v
        }
      })

      // Map itemId → meta
      const itemMeta: Record<string, { section: string; label: string; type: string }> = {}
      sectionsArr.forEach((section: any) => {
        const sectionRaw = section.title || section.sectionType || "Section inconnue"
        const sectionNorm = SECTION_MAP[sectionRaw] || sectionRaw
        ;(section.items || []).forEach((item: any) => {
          itemMeta[item.id] = { section: sectionNorm, label: item.label, type: item.type }
        })
      })

      // --- Génération de la ligne ---
      const row: any = {
        "Rapport ID": base.id,
        Site: site.name || "",
        "Site ID": site.siteId || "",
        Vendor: vendorName,
        Province: site.province || "",
        Region: site.region || "",
        "Site Type": site.siteType || "",
        "Power Configuration": site.powerConfiguration || "",
        Tenants: site.tenantsNames || "",
        FME: fme.fullName || base.fmeName || "",
        "PM Planned Date": base.pmPlannedDate || "",
        "PM Actual Date": base.pmActualDate || "",
        Status: base.status || "",
        "Type PM": base.pmType || "",
      }
      dynamicColumns.forEach((col) => (row[col] = ""))

      // Remplit chaque colonne dynamique par correspondance itemId
      dynamicColumns.forEach((col) => {
        if (col.endsWith(" - Autres")) return
        const possibleItemIds = allItemIdsByCol[col]
        if (!possibleItemIds) return
        let value = ""
        possibleItemIds.forEach((itemId) => {
          if (latestValuePerItem[itemId] && itemMeta[itemId]?.type !== "photo") {
            value = latestValuePerItem[itemId]?.value ?? ""
          }
        })
        row[col] = value
      })

      // Pour les items non mappés sur une colonne, ajoute dans "Autres"
      const autres: Record<string, string[]> = {}
      Object.keys(latestValuePerItem).forEach((itemId) => {
        const meta = itemMeta[itemId]
        if (!meta || meta.type === "photo") return
        const section = meta.section
        const labelRaw = meta.label
        const labelNorm = (ITEM_MAP[section] && ITEM_MAP[section][labelRaw]) || labelRaw
        const colName = `${section} - ${labelNorm}`
        if (!dynamicColumns.includes(colName)) {
          if (!autres[section]) autres[section] = []
          autres[section].push(`${labelNorm}: ${latestValuePerItem[itemId]?.value ?? ""}`)
        }
      })
      Object.keys(autres).forEach((section) => {
        const colName = `${section} - Autres`
        row[colName] = autres[section].join(" | ")
      })

      dataToExport.push(row)
    })

    // 3. Export XLSX
    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: columns })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapports")
    XLSX.writeFile(workbook, "rapports_groupes.xlsx")
    // -----
    // ⬆️ TOUT TON MAPPING/EXPORT EST CONSERVÉ
  }

  voirRapport(report: Report): void {
    const reportId = report?.report?.id || report?.["id"]
    if (reportId) {
      this.router.navigate(["/rapport", reportId])
    } else {
      console.warn("L'ID du rapport est introuvable.")
    }
  }
}
