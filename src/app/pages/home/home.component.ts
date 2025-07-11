import { Component, type OnInit, type OnDestroy } from "@angular/core"
import  { Router } from "@angular/router"
import  { DataService } from "src/app/services/data.service"
import { forkJoin, Subject, of } from "rxjs"
import { takeUntil, finalize, switchMap, catchError } from "rxjs/operators"

interface Report {
  id: string
  siteId: string
  pmType: string
  vendorId: string
  status: string
  createdAt: string
  pmActualDate: string
  pmPlannedDate: string
  report?: {
    id: string
    status: string
    vendorId: string
    site?: {
      vendorId: string
    }
    fme?: {
      vendorId: string
    }
  }
  site?: {
    vendorId: string
  }
  fme?: {
    vendorId: string
  }
}

interface StatRegion {
  region: string
  count: number
}

interface StatPowerConfig {
  powerConfiguration: string
  count: number
}

interface StatProvince {
  province: string
  count: number
}

interface StatSiteType {
  siteType: string
  count: number
}

interface StatVendor {
  vendorId: string
  vendorName: string
  count: number
}

interface PowerTypes {
  solar: number
  grid: number
  hybrid: number
  dg: number
  battery: number
}

interface StatsResponse {
  total: number
  byRegion: StatRegion[]
  byPowerConfig: StatPowerConfig[]
  byProvince: StatProvince[]
  bySiteType: StatSiteType[]
  byVendor: StatVendor[]
  powerTypes: PowerTypes
}

interface User {
  id: string
  role: string
  vendorId?: string
  fullName?: string
  email?: string
}

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  // Loading states
  loading = true
  cardsLoading = true
  chartsLoading = true

  // User info
  role = ""
  vendorId = ""
  currentUser: User | null = null

  // KPI Data basés sur les RAPPORTS réels
  totalSites = 0
  totalReports = 0
  completedReports = 0 // Rapports submitted/approved
  overdueReports = 0 // Rapports draft/rejected

  // Stats data
  byRegion: StatRegion[] = []
  byVendor: StatVendor[] = []
  powerTypes: PowerTypes = { solar: 0, grid: 0, hybrid: 0, dg: 0, battery: 0 }

  // Charts data
  regionChartLabels: string[] = []
  regionChartData: any[] = []

  powerTypeChartLabels: string[] = ["Solar", "Grid", "Hybrid", "DG", "Battery"]
  powerTypeChartData: any[] = []

  vendorChartLabels: string[] = []
  vendorChartData: any[] = []

  // Chart options avec backgrounds BLANCS
  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: "500",
          },
          color: "#495057",
        },
      },
      tooltip: {
        backgroundColor: "#ffffff", // BLANC PUR
        titleColor: "#212529",
        bodyColor: "#495057",
        borderColor: "#dee2e6",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          weight: "600",
          size: 13,
        },
        bodyFont: {
          weight: "500",
          size: 12,
        },
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#6c757d",
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f8f9fa", // GRIS TRÈS CLAIR
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#6c757d",
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      },
    },
  }

  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: "500",
          },
          color: "#495057",
        },
      },
      tooltip: {
        backgroundColor: "#ffffff", // BLANC PUR
        titleColor: "#212529",
        bodyColor: "#495057",
        borderColor: "#dee2e6",
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: {
          weight: "600",
          size: 13,
        },
        bodyFont: {
          weight: "500",
          size: 12,
        },
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((context.parsed * 100) / total).toFixed(1)
            return `${context.label}: ${context.parsed} (${percentage}%)`
          },
        },
      },
    },
    cutout: "60%",
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: "#ffffff",
      },
    },
  }

  constructor(
    private dataService: DataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUserAndData()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadUserAndData(): void {
    // Vérifier d'abord la persistance de session
    this.checkUserSession()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User) => {
          if (!user) {
            console.error("Utilisateur non authentifié.")
            this.router.navigate(["/login"])
            return
          }

          this.currentUser = user
          this.role = user.role
          this.vendorId = user.vendorId || ""

          // Charger toutes les données en parallèle
          this.loadAllData()
        },
        error: (err: any) => {
          console.error("Erreur récupération utilisateur :", err)
          this.router.navigate(["/login"])
        },
      })
  }

  private checkUserSession() {
    // Vérifier d'abord le localStorage puis valider avec le serveur
    return this.dataService.getCurrentUser().pipe(
      switchMap((localUser: User | null) => {
        if (localUser) {
          // Vérifier la validité avec le serveur
          return this.dataService.getUserProfile().pipe(
            switchMap((serverUser: User) => {
              // Mettre à jour les données locales avec les données du serveur
              this.dataService.saveUser(serverUser)
              return of(serverUser)
            }),
            catchError((err: any) => {
              console.warn("Session expirée, redirection vers login")
              this.dataService.logout()
              throw err
            }),
          )
        } else {
          throw new Error("Aucun utilisateur local")
        }
      }),
      catchError((err: any) => {
        console.error("Erreur vérification session:", err)
        this.dataService.logout()
        throw err
      }),
    )
  }

  private loadAllData(): void {
    this.loading = true
    this.cardsLoading = true
    this.chartsLoading = true

    // Charger toutes les données en parallèle
    const dataRequests = forkJoin({
      reports: this.dataService.getReports(), // ANALYSER LES RAPPORTS DIRECTEMENT
      stats: this.dataService.getStats(),
    })

    dataRequests
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false
          this.cardsLoading = false
          this.chartsLoading = false
        }),
      )
      .subscribe({
        next: ({ reports, stats }) => {
          this.processReportsData(reports) // NOUVELLE LOGIQUE BASÉE SUR LES RAPPORTS
          this.processStatsData(stats)
          this.updateAllCharts()
        },
        error: (err: any) => {
          console.error("Erreur chargement données dashboard:", err)
        },
      })
  }

  private processReportsData(reports: Report[]): void {
    console.log("📊 Analyse des rapports reçus:", reports)

    // Filtrer selon le rôle de l'utilisateur
    let filteredReports = reports

    if (this.role === "vendor_admin" && this.vendorId) {
      filteredReports = reports.filter((report) => {
        // Vérifier plusieurs sources possibles pour le vendorId
        const reportVendorId =
          report.vendorId ||
          report.report?.vendorId ||
          report.report?.site?.vendorId ||
          report.report?.fme?.vendorId ||
          report.site?.vendorId ||
          report.fme?.vendorId

        return reportVendorId === this.vendorId
      })
    }

    this.totalReports = filteredReports.length

    // ANALYSER LES STATUTS DES RAPPORTS DIRECTEMENT
    let completed = 0
    let overdue = 0

    filteredReports.forEach((report) => {
      const status = (report.report?.status || report.status || "").toLowerCase()

      console.log(`📋 Rapport ${report.id}: statut = "${status}"`)

      // COMPLETED = submitted ou approved
      if (status === "submitted" || status === "approved") {
        completed++
      }
      // OVERDUE = draft ou rejected
      else if (status === "draft" || status === "rejected") {
        overdue++
      }
    })

    this.completedReports = completed
    this.overdueReports = overdue

    console.log(`📊 Statistiques des rapports:`)
    console.log(`   - Total: ${this.totalReports}`)
    console.log(`   - Completed (submitted/approved): ${completed}`)
    console.log(`   - Overdue (draft/rejected): ${overdue}`)
  }

  private processStatsData(stats: StatsResponse): void {
    this.totalSites = stats.total
    this.byRegion = stats.byRegion || []
    this.byVendor = stats.byVendor || []
    this.powerTypes = stats.powerTypes || { solar: 0, grid: 0, hybrid: 0, dg: 0, battery: 0 }
  }

  private updateAllCharts(): void {
    this.updateRegionChart()
    this.updatePowerTypeChart()
    this.updateVendorChart()
  }

  private updateRegionChart(): void {
    this.regionChartLabels = this.byRegion.map((r) => r.region)
    this.regionChartData = [
      {
        data: this.byRegion.map((r) => r.count),
        label: "Sites par Région",
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(54, 162, 235, 0.9)",
        hoverBorderColor: "rgba(54, 162, 235, 1)",
      },
    ]
  }

  private updatePowerTypeChart(): void {
    const colors = [
      "rgba(255, 206, 86, 0.8)", // Solar - Yellow
      "rgba(54, 162, 235, 0.8)", // Grid - Blue
      "rgba(75, 192, 192, 0.8)", // Hybrid - Teal
      "rgba(153, 102, 255, 0.8)", // DG - Purple
      "rgba(255, 99, 132, 0.8)", // Battery - Red
    ]

    const borderColors = [
      "rgba(255, 206, 86, 1)",
      "rgba(54, 162, 235, 1)",
      "rgba(75, 192, 192, 1)",
      "rgba(153, 102, 255, 1)",
      "rgba(255, 99, 132, 1)",
    ]

    this.powerTypeChartData = [
      {
        data: [
          this.powerTypes.solar,
          this.powerTypes.grid,
          this.powerTypes.hybrid,
          this.powerTypes.dg,
          this.powerTypes.battery,
        ],
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 10,
      },
    ]
  }

  private updateVendorChart(): void {
    this.vendorChartLabels = this.byVendor.map((v) => v.vendorName)
    this.vendorChartData = [
      {
        data: this.byVendor.map((v) => v.count),
        label: "Sites par Vendor",
        backgroundColor: "rgba(255, 167, 38, 0.8)",
        borderColor: "rgba(255, 167, 38, 1)",
        borderWidth: 2,
        hoverBackgroundColor: "rgba(255, 167, 38, 0.9)",
        hoverBorderColor: "rgba(255, 167, 38, 1)",
      },
    ]
  }

  // Navigation methods
  navigateToReports(): void {
    this.router.navigate(["/rapports"])
  }

  navigateToSites(): void {
    this.router.navigate(["/sites"])
  }

  navigateToPMs(): void {
    this.router.navigate(["/pm-schedules"])
  }

  // Navigation vers les rapports avec filtres appropriés
  navigateToCompletedReports(): void {
    this.router.navigate(["/rapports"], { queryParams: { status: "submitted,approved" } })
  }

  navigateToOverdueReports(): void {
    this.router.navigate(["/rapports"], { queryParams: { status: "draft,rejected" } })
  }

  // Refresh data
  refreshData(): void {
    this.loadAllData()
  }
}
