import { Component, type OnInit } from "@angular/core"
import  { Router } from "@angular/router"
import  { DataService } from "src/app/services/data.service"
import * as XLSX from "xlsx"

const VENDOR_MAP: Record<string, string> = {
  "fe85da04-2d40-40eb-86f5-682fde6f9573": "Novacom",
  "c257ad68-2390-425a-9946-f800c48fe8c4": "Geek",
  "8014a694-842d-48fd-9c4d-dc32cf15fb93": "Global Tech",
  "fe2f623f-1900-431f-8684-7659e180a207": "Netis",
  "3aed5813-e6a8-4670-b1f0-775aa4fbe9be": "East Castle",
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
  values?: any[]
  photos?: any[]
  // Propriétés directes possibles (structure alternative)
  id?: string
  fme?: {
    fullName?: string
    vendorId?: string
  }
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

@Component({
  selector: "app-all-reports",
  templateUrl: "./all-reports.component.html",
  styleUrls: ["./all-reports.component.css"],
})
export class AllReportsComponent implements OnInit {
  // Données d'affichage (rapides) - TOUS les rapports pour pagination côté client
  reports: Report[] = []
  allReportsBackup: Report[] = []
  pagedReports: Report[] = []

  // Données détaillées pour Excel (lentes) - viennent de getAllReportsDetails()
  detailedReports: Report[] = []
  detailedReportsLoading = false
  detailedReportsReady = false

  currentPage = 1
  itemsPerPage = 50
  totalPages = 0
  totalItems = 0
  loading = true
  initialLoading = true
  error: string | null = null
  filterStartDate: string | null = null
  filterEndDate: string | null = null
  searchTerm = ""
  showSkeleton = true
  Math = Math
  excelLoading = false

  currentUser: { role?: string; vendorId?: string; [key: string]: any } | null = null

  // Cache simplifié - seulement pour les données d'affichage
  private cacheKey = "reports_display_cache"
  private cacheTimestamp = "reports_display_timestamp"
  private cacheExpiry = 5 * 60 * 1000
  statusFilter = ""

  constructor(
    private data: DataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.data.getCurrentUser().subscribe((user) => {
      this.currentUser = user
      if (!this.currentUser) {
        console.error("Utilisateur non connecté !")
        this.router.navigate(["/login"])
        return
      }

      // Charger IMMÉDIATEMENT TOUS les rapports pour l'affichage
      this.loadAllDisplayReports()

      // Charger les données Excel en arrière-plan (asynchrone)
      setTimeout(() => {
        this.loadDetailedReportsInBackground()
      }, 2000)
    })
  }

  // CHARGER TOUS LES RAPPORTS pour l'affichage et la pagination côté client
  loadAllDisplayReports(): void {
    const cachedData = this.getCachedReports()
    if (cachedData) {
      console.log("📦 Affichage depuis le cache")
      this.processDisplayReports(cachedData)
      return
    }

    console.log("🌐 Chargement de TOUS les rapports pour l'affichage...")
    this.loading = true
    this.initialLoading = true
    this.showSkeleton = true
    this.error = null

    // UTILISER getAllReportsDetails() SANS les détails pour charger tous les rapports rapidement
    // On passe includeDetails=false pour avoir juste les données de base
    this.data.getReports().subscribe({
      next: (response: any) => {
        console.log("All reports loaded for display:", response)

        // Gérer les différents formats de réponse
        let reportsArray: Report[] = []

        if (Array.isArray(response)) {
          reportsArray = response
        } else if (response && response.data && Array.isArray(response.data)) {
          reportsArray = response.data

          // Si on n'a qu'une page mais qu'il y en a plus, charger tout
          if (response.totalItems && response.totalItems > response.data.length) {
            console.log("⚠️ Seulement", response.data.length, "rapports chargés sur", response.totalItems, "total")
            console.log("🔄 Chargement de tous les rapports...")
            this.loadAllReportsFromServer()
            return
          }
        } else {
          console.warn("Format de réponse inattendu:", response)
          this.handleEmptyResponse()
          return
        }

        if (reportsArray && reportsArray.length > 0) {
          console.log("📊 Traitement de", reportsArray.length, "rapports pour l'affichage")
          const filteredReports = this.filterReportsByUser(reportsArray)
          this.setCachedReports(filteredReports)
          this.processDisplayReports(filteredReports)
        } else {
          console.log("❌ Aucun rapport trouvé dans les données")
          this.handleEmptyResponse()
        }
      },
      error: (err: any) => {
        console.error("Erreur chargement affichage:", err)
        this.error = "Erreur de chargement des rapports."
        this.showSkeleton = false
        this.loading = false
        this.initialLoading = false
      },
    })
  }

  // Charger TOUS les rapports depuis le serveur (sans pagination)
  private loadAllReportsFromServer(): void {
    console.log("🔄 Chargement de TOUS les rapports depuis le serveur...")

    // Utiliser getAllReportsDetails() mais sans les détails complets
    // Juste pour avoir tous les rapports de base
    this.data.getAllReportsDetails({ includeBasicOnly: true }).subscribe({
      next: (response: any) => {
        console.log("✅ Tous les rapports chargés:", response)

        let allReports: Report[] = []

        if (Array.isArray(response)) {
          allReports = response
        } else if (response && response.data && Array.isArray(response.data)) {
          allReports = response.data
        }

        console.log("✅ Total rapports chargés:", allReports.length)

        const filteredReports = this.filterReportsByUser(allReports)
        this.setCachedReports(filteredReports)
        this.processDisplayReports(filteredReports)
      },
      error: (error) => {
        console.error("Erreur lors du chargement de tous les rapports:", error)
        // Fallback : utiliser les données partielles qu'on a déjà
        console.log("📦 Utilisation des données partielles disponibles")
        this.handleEmptyResponse()
      },
    })
  }

  private processDisplayReports(reports: Report[]): void {
    console.log("🔄 Traitement des rapports d'affichage:", reports.length)

    this.allReportsBackup = reports
    this.reports = [...this.allReportsBackup]
    this.totalItems = this.reports.length
    this.currentPage = 1
    this.calculateTotalPages()
    this.setPagedReports()

    console.log("✅ Rapports traités:", {
      total: this.totalItems,
      pages: this.totalPages,
      itemsPerPage: this.itemsPerPage,
      currentPageItems: this.pagedReports.length,
    })

    setTimeout(() => {
      this.showSkeleton = false
      this.loading = false
      this.initialLoading = false
    }, 300)
  }

  // DONNÉES EXCEL - LENTES (getAllReportsDetails) - EN ARRIÈRE-PLAN
  loadDetailedReportsInBackground(): void {
    console.log("🔄 Chargement données Excel en arrière-plan...")
    this.detailedReportsLoading = true
    this.detailedReportsReady = false

    // Construire les filtres actuels
    const filters = this.getCurrentFilters()

    // UTILISER getAllReportsDetails() pour les données Excel complètes
    this.data.getAllReportsDetails(filters).subscribe({
      next: (response: any) => {
        console.log("✅ Données Excel chargées:", response)

        // Gérer les différents formats de réponse
        let reportsArray: Report[] = []

        if (Array.isArray(response)) {
          reportsArray = response
        } else if (response && response.data && Array.isArray(response.data)) {
          reportsArray = response.data
        } else {
          console.warn("Format de réponse Excel inattendu:", response)
          reportsArray = []
        }

        console.log("📊 Données Excel:", reportsArray.length, "rapports")

        const filteredReports = this.filterReportsByUser(reportsArray)
        this.detailedReports = filteredReports
        this.detailedReportsLoading = false
        this.detailedReportsReady = true

        console.log("✅ Export Excel maintenant disponible avec", filteredReports.length, "rapports !")
      },
      error: (err: any) => {
        console.error("Erreur chargement données Excel:", err)
        this.detailedReportsLoading = false
        this.detailedReportsReady = false

        // Fallback : utiliser les données d'affichage pour Excel si disponibles
        if (this.allReportsBackup.length > 0) {
          console.log("📦 Utilisation des données d'affichage pour Excel")
          this.detailedReports = this.allReportsBackup
          this.detailedReportsReady = true
        }
      },
    })
  }

  private filterReportsByUser(reports: Report[]): Report[] {
    if (this.currentUser?.role === "vendor_admin") {
      return reports.filter((r) => {
        const vendorId = r?.report?.fme?.vendorId || r?.fme?.vendorId || r?.vendorId
        return vendorId === this.currentUser?.vendorId
      })
    }
    return reports
  }

  private getCurrentFilters(): any {
    const filters: any = {}

    if (this.statusFilter) {
      filters.status = this.statusFilter
    }

    if (this.searchTerm) {
      filters.searchTerm = this.searchTerm
    }

    if (this.filterStartDate) {
      filters.startDate = this.filterStartDate
    }

    if (this.filterEndDate) {
      filters.endDate = this.filterEndDate
    }

    return filters
  }

  getVendorName(report: Report): string {
    const site = report?.report?.site || report?.site
    if (site?.vendorId && VENDOR_MAP[site.vendorId]) {
      return VENDOR_MAP[site.vendorId]
    }
    return site?.portfolio || "N/A"
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage)
  }

  setPagedReports(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    this.pagedReports = this.reports.slice(startIndex, startIndex + this.itemsPerPage)

    console.log("📄 Page", this.currentPage, ":", this.pagedReports.length, "rapports sur", this.totalItems, "total")
  }

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

  // FILTRES - Appliqués aux données d'affichage (côté client)
  applyDateFilter(): void {
    if (!this.filterStartDate && !this.filterEndDate) {
      this.reports = [...this.allReportsBackup]
    } else {
      const start = this.filterStartDate ? new Date(this.filterStartDate) : null
      const end = this.filterEndDate ? new Date(this.filterEndDate) : null

      this.reports = this.allReportsBackup.filter((r) => {
        const actualDate = r.report?.pmActualDate || r.pmActualDate
        if (!actualDate) return false

        const reportDate = new Date(actualDate)
        if (start && end) return reportDate >= start && reportDate <= end
        if (start) return reportDate >= start
        if (end) return reportDate <= end
        return true
      })
    }

    this.totalItems = this.reports.length
    this.currentPage = 1
    this.calculateTotalPages()
    this.setPagedReports()

    // Recharger les données Excel avec les nouveaux filtres
    this.reloadDetailedReports()
  }

  resetFilter(): void {
    this.filterStartDate = null
    this.filterEndDate = null
    this.searchTerm = ""
    this.statusFilter = ""
    this.reports = [...this.allReportsBackup]
    this.totalItems = this.reports.length
    this.currentPage = 1
    this.calculateTotalPages()
    this.setPagedReports()

    // Recharger les données Excel
    this.reloadDetailedReports()
  }

  private reloadDetailedReports(): void {
    // Recharger les données Excel avec les nouveaux filtres
    setTimeout(() => {
      this.loadDetailedReportsInBackground()
    }, 500)
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === -1) return
    this.currentPage = page
    this.setPagedReports()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase()

    this.reports = this.allReportsBackup.filter((report) => {
      const siteName = (report.report?.site?.name || report.site?.name || "").toLowerCase()
      const vendorName = this.getVendorName(report).toLowerCase()
      const fmeName = (
        report.report?.fme?.fullName ||
        report.report?.fmeName ||
        report.fme?.fullName ||
        report.fmeName ||
        ""
      ).toLowerCase()
      const status = (report.report?.status || report.status || "").toLowerCase()

      const matchesSearch = siteName.includes(term) || vendorName.includes(term) || fmeName.includes(term)
      const matchesStatus = !this.statusFilter || status === this.statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })

    this.totalItems = this.reports.length
    this.currentPage = 1
    this.calculateTotalPages()
    this.setPagedReports()

    // Recharger les données Excel avec les nouveaux filtres
    this.reloadDetailedReports()
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

  exportExcel(): void {
    // Utiliser les données détaillées si disponibles, sinon les données d'affichage
    let dataToUse = this.detailedReports

    if (!this.detailedReportsReady || !this.detailedReports.length) {
      if (this.allReportsBackup.length > 0) {
        console.log("📦 Utilisation des données d'affichage pour l'export Excel")
        dataToUse = this.allReportsBackup
      } else {
        alert("Aucune donnée disponible pour l'export.")
        return
      }
    }

    this.excelLoading = true

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

    const allSectionLabels: Record<string, Set<string>> = {}
    const allItemIdsByCol: Record<string, Set<string>> = {}

    // Analyser toutes les sections et items pour créer les colonnes dynamiques
    dataToUse.forEach((report) => {
      const sectionsArr: any[] = report.sections || []

      sectionsArr.forEach((section: any) => {
        const sectionRaw = section.title || section.sectionType || "Section inconnue"
        const sectionNorm = SECTION_MAP[sectionRaw] || sectionRaw
        if (!allSectionLabels[sectionNorm]) allSectionLabels[sectionNorm] = new Set()
        ;(section.items || []).forEach((item: any) => {
          if (item.type !== "photo") {
            const labelRaw = item.label || item.type || "Item inconnu"
            const colKey = `${sectionNorm} - ${labelRaw}`
            allSectionLabels[sectionNorm].add(labelRaw)

            if (!allItemIdsByCol[colKey]) allItemIdsByCol[colKey] = new Set()
            allItemIdsByCol[colKey].add(item.id)
          }
        })
      })
    })

    // Créer les colonnes dans l'ordre défini
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
      "Rapport ID",
      "Site",
      "Site ID",
      "Vendor",
      "Province",
      "Region",
      "Site Type",
      "Power Configuration",
      "Tenants",
      "FME",
      "PM Actual Date",
      "Status",
      "Type PM",
    ]
    const columns = [...infoColumns, ...dynamicColumns]

    const dataToExport: any[] = []

    dataToUse.forEach((report) => {
      const base = report.report || report
      const site = base.site || {}
      const fme = base.fme || {}
      const vendorName = this.getVendorName(report)

      const valuesArr: any[] = report.values || []
      const sectionsArr: any[] = report.sections || []

      // Créer un mapping des valeurs par item ID
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

      // Créer un mapping des métadonnées des items
      const itemMeta: Record<string, { section: string; label: string; type: string }> = {}
      sectionsArr.forEach((section: any) => {
        const sectionRaw = section.title || section.sectionType || "Section inconnue"
        const sectionNorm = SECTION_MAP[sectionRaw] || sectionRaw
        ;(section.items || []).forEach((item: any) => {
          itemMeta[item.id] = { section: sectionNorm, label: item.label, type: item.type }
        })
      })

      // Créer la ligne de données
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
        "PM Actual Date": base.pmActualDate || "",
        Status: base.status || "",
        "Type PM": base.pmType || "",
      }

      // Initialiser toutes les colonnes dynamiques
      dynamicColumns.forEach((col) => (row[col] = ""))

      // Remplir les colonnes avec les valeurs correspondantes
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

      // Gérer les colonnes "Autres" pour les items non mappés
      const autres: Record<string, string[]> = {}
      Object.keys(latestValuePerItem).forEach((itemId) => {
        const meta = itemMeta[itemId]
        if (!meta || meta.type === "photo") return
        const section = meta.section
        const labelRaw = meta.label
        const colName = `${section} - ${labelRaw}`
        if (!dynamicColumns.includes(colName)) {
          if (!autres[section]) autres[section] = []
          autres[section].push(`${labelRaw}: ${latestValuePerItem[itemId]?.value ?? ""}`)
        }
      })
      Object.keys(autres).forEach((section) => {
        const colName = `${section} - Autres`
        row[colName] = autres[section].join(" | ")
      })

      dataToExport.push(row)
    })

    console.log("📊 Export Excel avec", dataToExport.length, "rapports")

    setTimeout(() => {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: columns })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapports")

      // Nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filename = `rapports_groupes_${timestamp}.xlsx`

      XLSX.writeFile(workbook, filename)
      this.excelLoading = false

      console.log("✅ Export Excel terminé :", filename)
    }, 1000)
  }

  voirRapport(report: Report): void {
    const reportId = report?.report?.id || report?.id

    if (reportId) {
      this.router.navigate(["/rapport", reportId])
    } else {
      console.warn("L'ID du rapport est introuvable.", report)
    }
  }

  // Méthodes de cache simplifiées (seulement pour l'affichage)
  private getCachedReports(): Report[] | null {
    try {
      const timestamp = localStorage.getItem(this.cacheTimestamp)
      const cachedData = localStorage.getItem(this.cacheKey)

      if (!timestamp || !cachedData) {
        return null
      }

      const cacheAge = Date.now() - Number.parseInt(timestamp)
      if (cacheAge > this.cacheExpiry) {
        localStorage.removeItem(this.cacheKey)
        localStorage.removeItem(this.cacheTimestamp)
        return null
      }

      return JSON.parse(cachedData)
    } catch (error) {
      console.error("Erreur lors de la lecture du cache:", error)
      return null
    }
  }

  private setCachedReports(reports: Report[]): void {
    try {
      // Stocker seulement les données essentielles pour éviter le quota
      const lightReports = reports.map((report) => ({
        report: {
          id: report.report?.id || report.id,
          fmeName: report.report?.fmeName || report.fmeName,
          pmActualDate: report.report?.pmActualDate || report.pmActualDate,
          status: report.report?.status || report.status,
          site: {
            name: report.report?.site?.name || report.site?.name,
            siteId: report.report?.site?.siteId || report.site?.siteId,
            province: report.report?.site?.province || report.site?.province,
            vendorId: report.report?.site?.vendorId || report.site?.vendorId,
          },
          fme: {
            fullName: report.report?.fme?.fullName || report.fme?.fullName,
            vendorId: report.report?.fme?.vendorId || report.fme?.vendorId,
          },
        },
      }))

      localStorage.setItem(this.cacheKey, JSON.stringify(lightReports))
      localStorage.setItem(this.cacheTimestamp, Date.now().toString())
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du cache:", error)
      // Si le cache échoue, ce n'est pas grave, on continue sans cache
    }
  }

  private handleEmptyResponse(): void {
    this.error = "Aucun rapport valide trouvé."
    this.reports = []
    this.pagedReports = []
    this.totalPages = 0
    this.totalItems = 0
    this.showSkeleton = false
    this.loading = false
    this.initialLoading = false
  }

  refreshFromServer(): void {
    // Vider le cache d'affichage
    localStorage.removeItem(this.cacheKey)
    localStorage.removeItem(this.cacheTimestamp)

    // Recharger TOUS les rapports immédiatement
    this.loadAllDisplayReports()

    // Recharger les données Excel en arrière-plan
    setTimeout(() => {
      this.loadDetailedReportsInBackground()
    }, 2000)
  }

  applyStatusFilter(): void {
    this.applySearch()
  }

  // Getter pour savoir si l'export Excel est disponible
  get isExcelReady(): boolean {
    return this.detailedReportsReady || this.allReportsBackup.length > 0
  }

  // Getter pour le texte du bouton Excel
  get excelButtonText(): string {
    if (this.excelLoading) return "Exporting..."
    if (this.detailedReportsLoading) return "Preparing Excel data..."
    if (!this.detailedReportsReady && this.allReportsBackup.length > 0) return "Export Excel (Basic)"
    if (!this.detailedReportsReady) return "Loading Excel data..."
    return "Export Excel (Full)"
  }
}
