import React from 'react';

const PriceComparison = ({ changes }) => {
  return (
    <div className="price-comparison">
      <h3>Perubahan Harga</h3>
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Harga Lama</th>
            <th>Harga Baru</th>
            <th>Perubahan</th>
            <th>Margin</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((item, index) => (
            <tr key={index} className={item.price_change > 0 ? 'price-up' : 'price-down'}>
              <td>{item.nama}</td>
              <td>Rp {item.previous_price?.toLocaleString() || '-'}</td>
              <td>Rp {item.harga_beli.toLocaleString()}</td>
              <td>{item.price_change > 0 ? '+' : ''}{item.price_change.toFixed(2)}%</td>
              <td>{item.margin.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PriceComparison;