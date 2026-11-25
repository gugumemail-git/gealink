'use client'
import { QRCodeSVG } from 'qrcode.react'
import type { LinkWithStats } from '@/lib/types'

interface Props {
  linkId: string | null
  links: LinkWithStats[]
  onClose: () => void
  onRefresh: () => void
}

export default function DetailDrawer({ linkId, links, onClose }: Props) {
  const link = links.find(l => l.id === linkId)
  if (!linkId || !link) return null

  return (
    <>
      <div className="drawer-overlay show" onClick={onClose} />
      <aside className="drawer show">
        <div className="drawer-header">
          <span className="drawer-title">Detail Link</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          <div className="detail-group">
            <div className="detail-label">Short URL</div>
            <div className="detail-value">gea.my.id/{link.slug}</div>
          </div>
          <div className="detail-group">
            <div className="detail-label">URL Tujuan</div>
            <div className="detail-value">{link.destination_url}</div>
          </div>
          <div className="detail-group">
            <div className="detail-label">Total Klik</div>
            <div className="stat-value">{link.total_clicks.toLocaleString()}</div>
          </div>
          <div className="detail-group">
            <div className="detail-label">QR Code</div>
            <div className="qr-container">
              <QRCodeSVG value={`https://gea.my.id/${link.slug}`} size={160} bgColor="#ffffff" fgColor="#101828" />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}