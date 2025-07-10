import { Component, type OnInit } from "@angular/core"
import { ActivatedRoute } from "@angular/router"
import { DataService } from "src/app/services/data.service"
import * as pdfMake from "pdfmake/build/pdfmake"
import * as pdfFonts from "pdfmake/build/vfs_fonts"
;(pdfMake as any).vfs = (pdfFonts as any).vfs

@Component({
  selector: "app-rapport-detail",
  templateUrl: "./detail-report.component.html",
  styleUrls: ["./detail-report.component.css"],
})
export class DetailReportComponent implements OnInit {
  rapport: any = {}
  photos: any[] = []
  sections: any[] = []
  isLoading = true

  // Lightbox properties
  showLightbox = false
  currentPhoto: any = null
  currentPhotoIndex = 0
  currentItemPhotos: any[] = []

  // Zoom properties
  zoomLevel = 1
  minZoom = 0.5
  maxZoom = 3
  panX = 0
  panY = 0
  isDragging = false
  lastMouseX = 0
  lastMouseY = 0
  Math = Math // Pour utiliser Math dans le template

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id")
    if (id) {
      this.loadReport(id)
    } else {
      console.warn("Aucun ID fourni dans l'URL.")
      this.isLoading = false
    }
  }

  private loadReport(id: string): void {
    this.dataService.getFullReport(id).subscribe({
      next: (res) => {
        this.rapport = res || {}
        this.photos = res?.photos || []
        this.sections = res?.sections || []
        this.isLoading = false
      },
      error: (err) => {
        console.error("Erreur lors du chargement du rapport :", err)
        this.isLoading = false
      },
    })
  }
  isSubmitting = false

  updateReportStatus(): void {
    const reportId = this.rapport.report?.id
    const newStatus = this.rapport.report?.status

    if (!reportId || !newStatus) {
      alert("Report information incomplete.")
      return
    }

    this.isSubmitting = true

    this.dataService.updateReportStatus(reportId, newStatus).subscribe({
      next: (response: any) => {
        this.isSubmitting = false
        // Update local data with response
        if (response?.report) {
          this.rapport.report = { ...this.rapport.report, ...response.report }
        }
        alert(`Report status successfully updated to: ${newStatus.toUpperCase()}`)
      },
      error: (err: any) => {
        console.error("Error updating report status:", err)
        this.isSubmitting = false
        alert("Failed to update report status. Please try again.")
      },
    })
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-warning text-dark" // Jaune
      case "submitted":
        return "bg-success" // Vert
      case "approved":
        return "bg-primary" // Bleu
      case "rejected":
        return "bg-danger" // Rouge
      default:
        return "bg-secondary" // Gris par défaut
    }
  }

  // Get the latest value for an item
  getLatestValue(itemId: string): any {
    const values = this.rapport.values || []
    if (!values.length) return null

    // Filter values for this item and sort by date (assuming there's a timestamp field)
    // If there's no timestamp, we'll just take the last one in the array
    const itemValues = values.filter((v: any) => v.reportItemId === itemId)
    if (!itemValues.length) return null

    if (itemValues[0].timestamp) {
      // Sort by timestamp if available
      return itemValues.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    }

    // Otherwise return the last one in the array
    return itemValues[itemValues.length - 1]
  }

  // Get photos for a specific item
  getItemPhotos(itemId: string): any[] {
    return (this.rapport.photos || []).filter((p: any) => p.itemId === itemId)
  }

  // Check if an item should show "Aucune Réponse"
  private shouldShowNoResponse(item: any, value: any, itemPhotos: any[]): boolean {
    // If there's a value, don't show "Aucune Réponse"
    if (value?.value) return false

    // If there are photos but no text value, don't show "Aucune Réponse"
    // (assuming it's a photo-only question)
    if (itemPhotos.length > 0 && !value?.value) return false

    // If no value and no photos, show "Aucune Réponse"
    return true
  }

  // Lightbox methods
  openLightbox(photo: any, itemPhotos: any[]): void {
    this.currentPhoto = photo
    this.currentItemPhotos = itemPhotos
    this.currentPhotoIndex = itemPhotos.findIndex((p) => p === photo)
    this.showLightbox = true
    // Reset zoom when opening lightbox
    this.resetZoom()
    document.body.style.overflow = "hidden"
  }

  closeLightbox(): void {
    this.showLightbox = false
    this.currentPhoto = null
    this.currentItemPhotos = []
    this.currentPhotoIndex = 0
    document.body.style.overflow = "auto" // Restore scrolling
  }

  previousPhoto(): void {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--
      this.currentPhoto = this.currentItemPhotos[this.currentPhotoIndex]
      this.resetZoom() // Reset zoom when changing photo
    }
  }

  nextPhoto(): void {
    if (this.currentPhotoIndex < this.currentItemPhotos.length - 1) {
      this.currentPhotoIndex++
      this.currentPhoto = this.currentItemPhotos[this.currentPhotoIndex]
      this.resetZoom() // Reset zoom when changing photo
    }
  }

  // Zoom methods
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.zoomLevel + 0.25, this.maxZoom)
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.zoomLevel - 0.25, this.minZoom)
      // Reset pan if zoom is back to 1 or less
      if (this.zoomLevel <= 1) {
        this.panX = 0
        this.panY = 0
      }
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1
    this.panX = 0
    this.panY = 0
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault()

    if (event.deltaY < 0) {
      this.zoomIn()
    } else {
      this.zoomOut()
    }
  }

  startDrag(event: MouseEvent): void {
    if (this.zoomLevel > 1) {
      this.isDragging = true
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
      event.preventDefault()
    }
  }

  onDrag(event: MouseEvent): void {
    if (this.isDragging && this.zoomLevel > 1) {
      const deltaX = event.clientX - this.lastMouseX
      const deltaY = event.clientY - this.lastMouseY

      this.panX += deltaX
      this.panY += deltaY

      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
    }
  }

  endDrag(): void {
    this.isDragging = false
  }

  getImageTransform(): string {
    return `scale(${this.zoomLevel}) translate(${this.panX / this.zoomLevel}px, ${this.panY / this.zoomLevel}px)`
  }

  downloadPhoto(): void {
    if (!this.currentPhoto) return

    const imageUrl = this.currentPhoto.url || this.currentPhoto.base64Image
    if (!imageUrl) return

    // Generate filename with site name and siteId
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const siteName = this.rapport.report?.site?.name || "Site"
    const siteId = this.rapport.report?.site?.siteId || "Unknown"
    const sanitizedSiteName = siteName.replace(/[^a-zA-Z0-9]/g, "_")
    const filename = `${sanitizedSiteName}_${siteId}_Photo_${timestamp}.jpg`

    // For base64 images, create blob and download
    if (imageUrl.startsWith("data:")) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // For URL images, fetch and download
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => {
        console.error("Erreur lors du téléchargement:", error)
        // Fallback: try direct download
        const link = document.createElement("a")
        link.href = imageUrl
        link.download = filename
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
  }

  // Handle keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (!this.showLightbox) return

    switch (event.key) {
      case "Escape":
        this.closeLightbox()
        break
      case "ArrowLeft":
        this.previousPhoto()
        break
      case "ArrowRight":
        this.nextPhoto()
        break
    }
  }

  // Convert image URL to base64
  private async convertImageToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Erreur lors de la conversion de l'image:", error)
      return ""
    }
  }

  // Convert all images to base64 for PDF
  private async convertAllImagesToBase64(photos: any[]): Promise<any[]> {
    const convertedPhotos = []

    for (const photo of photos) {
      if (photo.url && !photo.base64Image) {
        try {
          const base64Image = await this.convertImageToBase64(photo.url)
          convertedPhotos.push({
            ...photo,
            base64Image: base64Image,
          })
        } catch (error) {
          console.error("Erreur lors de la conversion de l'image:", error)
          convertedPhotos.push(photo)
        }
      } else {
        convertedPhotos.push(photo)
      }
    }

    return convertedPhotos
  }

  async exportToPDF(): Promise<void> {
    const report = this.rapport?.report
    const values = this.rapport?.values || []
    const allPhotos = this.rapport?.photos || []

    if (!report) {
      console.warn("Aucun rapport disponible pour export.")
      return
    }

    // Convert all images to base64 first
    const convertedPhotos = await this.convertAllImagesToBase64(allPhotos)

    // Function to get the latest value for an item
    const getLatestItemValue = (itemId: string) => {
      const itemValues = values.filter((v: any) => v.reportItemId === itemId)
      if (!itemValues.length) return null

      if (itemValues[0].timestamp) {
        return itemValues.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      }

      return itemValues[itemValues.length - 1]
    }

    // Get report date (use actual date or planned date as fallback)
    const reportDate = report.pmActualDate || report.pmPlannedDate
    const formattedDate = reportDate
      ? new Date(reportDate).toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR")

    // Créer le nom du fichier avec le nom du site
    const siteName = report.site?.name || "Unknown_Site"
    const sanitizedSiteName = siteName.replace(/[^a-zA-Z0-9]/g, "_") // Remplacer les caractères spéciaux
    const fileName = `PM_Report_${sanitizedSiteName}_${formattedDate.replace(/\//g, "-")}`

    // Utiliser any pour éviter les erreurs de type avec pdfMake
    const docDefinition: any = {
      pageMargins: [35, 80, 35, 50],
      header: {
        stack: [
          {
            table: {
              widths: ["60%", "40%"],
              body: [
                [
                  {
                    stack: [
                      { text: `Site: ${report.site?.name || "N/A"}`, style: "headerLeft" },
                      { text: `Date: ${formattedDate}`, style: "headerLeftSmall" },
                    ],
                  },
                  {
                    stack: [
                      { text: "EastCastle Infrastructure", style: "headerRight" },
                      { text: "Preventive Maintenance", style: "headerRightSmall" },
                    ],
                    alignment: "right",
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [35, 15, 35, 0],
          },
          // Ligne de séparation décorative avec opacité réduite
          {
            canvas: [
              { type: "line", x1: 35, y1: 0, x2: 560, y2: 0, lineWidth: 2, lineColor: "#3498db", opacity: 0.5 },
              { type: "line", x1: 35, y1: 3, x2: 560, y2: 3, lineWidth: 1, lineColor: "#e9ecef", opacity: 0.5 },
            ],
            margin: [0, 5, 0, 0],
          },
        ],
      },
      content: [
        { text: "Preventive Maintenance Report", style: "header" },

        // Site Information
        { text: "Site Information", style: "subheader", margin: [0, 20, 0, 10] },
        {
          table: {
            widths: ["30%", "70%"],
            body: [
              [{ text: "Site Name:", style: "tableHeader" }, { text: report.site?.name || "N/A" }],
              [
                { text: "Region / Province:", style: "tableHeader" },
                { text: `${report.site?.region || "N/A"} / ${report.site?.province || "N/A"}` },
              ],
              [
                { text: "Coordinates:", style: "tableHeader" },
                { text: `${report.site?.latitude || "N/A"}, ${report.site?.longitude || "N/A"}` },
              ],
              [{ text: "Tenants:", style: "tableHeader" }, { text: report.site?.tenantsNames || "N/A" }],
              [{ text: "Portfolio:", style: "tableHeader" }, { text: report.site?.portfolio || "N/A" }],
              [
                { text: "Power Configuration:", style: "tableHeader" },
                { text: report.site?.powerConfiguration || "N/A" },
              ],
              [{ text: "Site Type:", style: "tableHeader" }, { text: report.site?.siteType || "N/A" }],
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? "#f8f9fa" : null),
          },
        },

        // Report Summary
        { text: "Report Summary", style: "subheader", margin: [0, 20, 0, 10] },
        {
          table: {
            widths: ["30%", "70%"],
            body: [
              [{ text: "FME:", style: "tableHeader" }, { text: report.fmeName || "N/A" }],
              [
                { text: "PM Planned Date:", style: "tableHeader" },
                { text: report.pmPlannedDate ? new Date(report.pmPlannedDate).toLocaleDateString("fr-FR") : "N/A" },
              ],
              [
                { text: "PM Actual Date:", style: "tableHeader" },
                { text: report.pmActualDate ? new Date(report.pmActualDate).toLocaleDateString("fr-FR") : "N/A" },
              ],
              [{ text: "PM Type:", style: "tableHeader" }, { text: report.pmType || "N/A" }],
              [
                { text: "Status:", style: "tableHeader" },
                { text: report.status || "N/A", style: "statusValue" },
              ],
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? "#f8f9fa" : null),
          },
        },
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          alignment: "center",
          color: "#2c3e50",
          margin: [0, 0, 0, 15],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          color: "#3498db",
          margin: [0, 15, 0, 8],
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: "#2c3e50",
          margin: [0, 0, 0, 4],
        },
        tableHeader: {
          bold: true,
          color: "#2c3e50",
          fillColor: "#f8f9fa",
        },
        itemTitle: {
          fontSize: 11,
          color: "#495057",
          fillColor: "#f1f3f4",
          margin: [0, 0, 0, 0],
        },
        itemValue: {
          fontSize: 13,
          bold: true,
          color: "#2c3e50",
          margin: [0, 0, 0, 0],
        },
        noResponse: {
          fontSize: 13,
          bold: true,
          color: "#e74c3c",
          italics: true,
          margin: [0, 0, 0, 0],
        },
        itemComment: {
          fontSize: 10,
          italics: true,
          color: "#7f8c8d",
          fillColor: "#fafbfc",
          margin: [0, 0, 0, 0],
        },
        photoComment: {
          fontSize: 9,
          italics: true,
          color: "#7f8c8d",
          margin: [0, 3, 0, 5],
        },
        issueDetected: {
          color: "#e74c3c",
          bold: true,
        },
        noIssue: {
          color: "#27ae60",
          bold: true,
        },
        statusValue: {
          color: "#27ae60",
          bold: true,
        },
        // Styles d'en-tête avec opacité réduite
        headerLeft: {
          fontSize: 12,
          bold: true,
          color: "#2c3e50",
          opacity: 0.5,
        },
        headerLeftSmall: {
          fontSize: 10,
          color: "#7f8c8d",
          opacity: 0.5,
          margin: [0, 2, 0, 0],
        },
        headerRight: {
          fontSize: 14,
          bold: true,
          color: "#3498db",
          opacity: 0.5,
        },
        headerRightSmall: {
          fontSize: 10,
          color: "#7f8c8d",
          opacity: 0.5,
          margin: [0, 2, 0, 0],
        },
      },
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.3,
      },
    }

    // Ajouter les sections au contenu - APPROCHE SIMPLIFIÉE
    const sectionsContent: any[] = []

    for (let sectionIndex = 0; sectionIndex < report.sections.length; sectionIndex++) {
      const section = report.sections[sectionIndex]

      // Titre de la section - SANS pageBreakBefore complexe
      sectionsContent.push({
        text: section.title,
        style: "sectionTitle",
        margin: [0, sectionIndex === 0 ? 20 : 15, 0, 5],
      })

      // Issue detected
      sectionsContent.push({
        text: `Issue detected: ${section.hasIssue ? "Yes" : "No"}`,
        style: section.hasIssue ? "issueDetected" : "noIssue",
        margin: [0, 0, 0, 10],
      })

      // Ligne de séparation
      sectionsContent.push({
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#e9ecef" }],
        margin: [0, 0, 0, 8],
      })

      // Traiter TOUS les items de la même manière
      for (const item of section.items) {
        const value = getLatestItemValue(item.id)
        const itemPhotos = convertedPhotos.filter((p: any) => p.itemId === item.id)

        const itemContent: any[] = []

        // Question avec background gris
        itemContent.push({
          table: {
            widths: ["100%"],
            body: [[{ text: item.label, style: "itemTitle" }]],
          },
          layout: {
            fillColor: () => "#f1f3f4",
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 0, 0, 2],
        })

        // Réponse
        if (value?.value) {
          itemContent.push({
            table: {
              widths: ["100%"],
              body: [[{ text: value.value, style: "itemValue" }]],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
            margin: [0, 0, 0, 2],
          })
        } else if (this.shouldShowNoResponse(item, value, itemPhotos)) {
          itemContent.push({
            table: {
              widths: ["100%"],
              body: [[{ text: "Aucune Réponse", style: "noResponse" }]],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
            margin: [0, 0, 0, 2],
          })
        }

        // Commentaire
        if (value?.comment) {
          itemContent.push({
            table: {
              widths: ["100%"],
              body: [[{ text: `Commentaire: ${value.comment}`, style: "itemComment" }]],
            },
            layout: {
              fillColor: () => "#fafbfc",
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
            margin: [0, 0, 0, 2],
          })
        }

        // Photos
        if (itemPhotos.length > 0) {
          const photoRows: any[] = []

          for (let i = 0; i < itemPhotos.length; i += 2) {
            const row: any[] = []

            if (i < itemPhotos.length && itemPhotos[i].base64Image) {
              const photoCell: any = {
                stack: [
                  {
                    image: itemPhotos[i].base64Image,
                    width: 180,
                    alignment: "center",
                  },
                ],
              }

              if (itemPhotos[i].comment) {
                photoCell.stack.push({
                  text: itemPhotos[i].comment,
                  style: "photoComment",
                  alignment: "center",
                })
              }

              row.push(photoCell)
            } else {
              row.push("")
            }

            if (i + 1 < itemPhotos.length && itemPhotos[i + 1].base64Image) {
              const photoCell: any = {
                stack: [
                  {
                    image: itemPhotos[i + 1].base64Image,
                    width: 180,
                    alignment: "center",
                  },
                ],
              }

              if (itemPhotos[i + 1].comment) {
                photoCell.stack.push({
                  text: itemPhotos[i + 1].comment,
                  style: "photoComment",
                  alignment: "center",
                })
              }

              row.push(photoCell)
            } else {
              row.push("")
            }

            photoRows.push(row)
          }

          if (photoRows.length > 0) {
            itemContent.push({
              table: {
                widths: ["50%", "50%"],
                body: photoRows,
              },
              layout: "noBorders",
              margin: [0, 5, 0, 0],
            })
          }
        }

        // Ajouter l'item - SEULEMENT unbreakable si il y a des photos
        sectionsContent.push({
          stack: itemContent,
          unbreakable: itemPhotos.length > 0, // Seulement pour éviter séparation titre/photos
          margin: [0, 0, 0, 12],
        })
      }
    }

    // Ajouter les sections au document
    docDefinition.content.push(...sectionsContent)

    // Créer et télécharger le PDF avec le nom du site
    pdfMake.createPdf(docDefinition).download(fileName + ".pdf")
  }
}
