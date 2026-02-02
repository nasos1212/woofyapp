import { AlertCircle, Clock, XCircle } from "lucide-react";
import { VerificationStatus } from "@/hooks/useBusinessVerification";
import ContactPopover from "@/components/ContactPopover";

interface PendingApprovalBannerProps {
  status: VerificationStatus;
}

const PendingApprovalBanner = ({ status }: PendingApprovalBannerProps) => {
  if (status === "approved") return null;

  if (status === "pending") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Pending Approval</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your business is currently under review. Once approved, you'll be able to create offers, 
              verify members, and access all partner features. This usually takes 1-2 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">Application Rejected</h3>
            <p className="text-sm text-red-700 mt-1 mb-3">
              Unfortunately, your business application was not approved. Please contact our support team 
              for more information or to reapply.
            </p>
            <ContactPopover 
              triggerText="Contact Support" 
              triggerSize="sm"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PendingApprovalBanner;
