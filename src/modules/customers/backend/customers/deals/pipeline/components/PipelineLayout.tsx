"use client"

import * as React from 'react'

export function PipelineLayout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Hide sidebar and adjust layout for full-width pipeline view
    const styleId = 'pipeline-view-styles'
    let style = document.getElementById(styleId) as HTMLStyleElement | null
    
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    
    style.textContent = `
      /* Remove padding from main for full width pipeline */
      body:has([data-pipeline-view="true"]) main {
        padding: 0 !important;
      }
      
      /* Pipeline container - only this scrolls */
      [data-pipeline-view="true"] {
        height: 100%;
        overflow: hidden !important;
        width: 100%;
        display: flex;
        flex-direction: column;
      }
      
      /* Smooth scrolling */
      [data-pipeline-view="true"] * {
        scroll-behavior: smooth;
      }
      
      /* Custom scrollbar for horizontal scroll */
      [data-pipeline-view="true"] ::-webkit-scrollbar {
        height: 8px;
      }
      [data-pipeline-view="true"] ::-webkit-scrollbar-track {
        background: transparent;
      }
      [data-pipeline-view="true"] ::-webkit-scrollbar-thumb {
        background: hsl(var(--muted));
        border-radius: 4px;
      }
      [data-pipeline-view="true"] ::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--muted-foreground) / 0.3);
      }
    `

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return <div data-pipeline-view="true" className="w-full h-full">{children}</div>
}

