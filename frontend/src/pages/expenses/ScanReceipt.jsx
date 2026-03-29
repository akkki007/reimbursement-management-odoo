import Layout from '../../components/Layout';

export default function ScanReceipt() {
  return (
    <Layout>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-navy mb-6">
        Scan receipt
      </h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">OCR scanning coming in Phase 5.</p>
      </div>
    </Layout>
  );
}
