import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Printer } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import * as payslipService from '../../services/payslipService';
import { getErrorMessage } from '../../services/api';

export default function PayslipViewerModal({ open, onClose, payslip }) {
  const [blobUrl, setBlobUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !payslip) return undefined;
    setLoading(true);
    payslipService
      .fetchPayslipBlobUrl(payslip._id)
      .then(setBlobUrl)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));

    return () => {
      if (blobUrl) window.URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payslip?._id]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `${payslip.payslipNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    const printWindow = window.open(blobUrl);
    printWindow?.addEventListener('load', () => printWindow.print());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={payslip ? `Payslip ${payslip.payslipNumber}` : 'Payslip'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!blobUrl}>
            Print
          </Button>
          <Button icon={Download} onClick={handleDownload} disabled={!blobUrl}>
            Download PDF
          </Button>
        </>
      }
    >
      {loading || !blobUrl ? (
        <Spinner label="Loading payslip..." />
      ) : (
        <iframe title="Payslip preview" src={blobUrl} className="h-[70vh] w-full rounded-lg border border-gray-200" />
      )}
    </Modal>
  );
}
