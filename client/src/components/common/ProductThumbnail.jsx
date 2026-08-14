// client/src/components/common/ProductThumbnail.jsx — Dynamic Professional Product Badges
import React from 'react';

export default function ProductThumbnail({ product, size = 50 }) {
  if (product?.image) {
    return (
      <img
        src={product.image}
        alt={product.nameEn}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8 }}
      />
    );
  }

  const sku  = (product?.sku || '').toUpperCase();
  const name = (product?.nameEn || '').toLowerCase();

  let bgGradient = 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)';
  let icon = '📱';
  let label = 'PHONE';

  if (sku.startsWith('ACC-APP') || sku.startsWith('ACC-AUD') || sku.startsWith('ACC-JOY') || name.includes('airpods') || name.includes('earbuds') || name.includes('headset')) {
    bgGradient = 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)';
    icon = '🎧';
    label = 'AUDIO';
  } else if (sku.startsWith('ACC-ANK') || sku.startsWith('ACC-BAS') || sku.startsWith('ACC-FST') || name.includes('charger') || name.includes('power bank') || name.includes('cable')) {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)';
    icon = '⚡';
    label = 'POWER';
  } else if (sku.startsWith('ACC-PROT') || sku.startsWith('ACC-CASE') || name.includes('glass') || name.includes('case') || name.includes('protector')) {
    bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    icon = '🛡️';
    label = 'CASE';
  } else if (sku.startsWith('REP-') || name.includes('display') || name.includes('battery') || name.includes('repair')) {
    bgGradient = 'linear-gradient(135deg, #64748b 0%, #334155 100%)';
    icon = '🛠️';
    label = 'PART';
  } else if (sku.startsWith('USD-') || name.includes('used')) {
    bgGradient = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
    icon = '⭐';
    label = 'USED';
  }

  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 8,
      background: bgGradient,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ fontSize: size * 0.45, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.8, marginTop: 2, opacity: 0.9 }}>
        {label}
      </span>
    </div>
  );
}
