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

  printPage(): void {
    window.print()
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

    // Utiliser any pour éviter les erreurs de type avec pdfMake
    const docDefinition: any = {
      pageMargins: [40, 60, 40, 60],
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
                { text: report.pmPlannedDate ? new Date(report.pmPlannedDate).toLocaleDateString() : "N/A" },
              ],
              [
                { text: "PM Actual Date:", style: "tableHeader" },
                { text: report.pmActualDate ? new Date(report.pmActualDate).toLocaleDateString() : "N/A" },
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
          margin: [0, 0, 0, 20],
        },
        subheader: {
          fontSize: 16,
          bold: true,
          color: "#3498db",
          margin: [0, 10, 0, 5],
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: "#2c3e50",
          margin: [0, 15, 0, 5],
        },
        tableHeader: {
          bold: true,
          color: "#2c3e50",
          fillColor: "#f8f9fa",
        },
        itemTitle: {
          fontSize: 12,
          bold: true,
          color: "#2c3e50",
        },
        itemValue: {
          fontSize: 12,
          bold: true,
          color: "#2c3e50",
        },
        noResponse: {
          fontSize: 12,
          bold: true,
          color: "#e74c3c",
          italics: true,
        },
        itemComment: {
          fontSize: 10,
          italics: true,
          color: "#7f8c8d",
          margin: [0, 5, 0, 0],
        },
        photoComment: {
          fontSize: 9,
          italics: true,
          color: "#7f8c8d",
          margin: [0, 5, 0, 10],
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
      },
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.3,
      },
    }

    // Ajouter les sections au contenu
    const sectionsContent: any[] = []

    for (const section of report.sections) {
      // Ajouter le titre de la section
      sectionsContent.push(
        { text: section.title, style: "sectionTitle", margin: [0, 20, 0, 5] },
        {
          text: `Issue detected: ${section.hasIssue ? "Yes" : "No"}`,
          style: section.hasIssue ? "issueDetected" : "noIssue",
          margin: [0, 0, 0, 10],
        },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 10] },
      )

      // Ajouter les items
      for (const item of section.items) {
        const value = getLatestItemValue(item.id)
        const itemPhotos = convertedPhotos.filter((p: any) => p.itemId === item.id)

        // Créer la ligne question-réponse
        const questionResponse = {
          table: {
            widths: ["40%", "60%"],
            body: [
              [
                { text: item.label, style: "itemTitle" },
                {
                  text: value?.value || "Aucune Réponse",
                  style: value?.value ? "itemValue" : "noResponse",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 5, 0, 0],
        }

        sectionsContent.push(questionResponse)

        // Ajouter le commentaire s'il existe
        if (value?.comment) {
          sectionsContent.push({
            text: `Comment: ${value.comment}`,
            style: "itemComment",
            margin: [0, 2, 0, 5],
          })
        }

        // Ajouter les photos
        if (itemPhotos.length > 0) {
          const photoRows: any[] = []

          for (let i = 0; i < itemPhotos.length; i += 2) {
            const row: any[] = []

            // Première photo de la ligne
            if (i < itemPhotos.length && itemPhotos[i].base64Image) {
              const photoCell: any = {
                stack: [
                  {
                    image: itemPhotos[i].base64Image,
                    width: 200,
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

            // Deuxième photo de la ligne
            if (i + 1 < itemPhotos.length && itemPhotos[i + 1].base64Image) {
              const photoCell: any = {
                stack: [
                  {
                    image: itemPhotos[i + 1].base64Image,
                    width: 200,
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
            sectionsContent.push({
              table: {
                widths: ["50%", "50%"],
                body: photoRows,
              },
              layout: "noBorders",
              margin: [0, 10, 0, 15],
            })
          }
        } else {
          // Ajouter un peu d'espace si pas de photos
          sectionsContent.push({ text: "", margin: [0, 0, 0, 10] })
        }
      }
    }

    // Ajouter les sections au document
    docDefinition.content.push(...sectionsContent)

    pdfMake.createPdf(docDefinition).open()
  }
}
