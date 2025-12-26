import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, Clock, Users, TrendingUp, Gift, Building2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const recentScans = [
  { member: "John S.", pet: "Max", time: "2 mins ago", status: "valid", discount: "15% off" },
  { member: "Sarah M.", pet: "Bella", time: "15 mins ago", status: "valid", discount: "15% off" },
  { member: "Mike R.", pet: "Rocky", time: "1 hour ago", status: "expired", discount: "N/A" },
  { member: "Emma L.", pet: "Luna", time: "2 hours ago", status: "valid", discount: "15% off" },
];

const BusinessDashboard = () => {
  const [scanResult, setScanResult] = useState<null | {
    status: 'valid' | 'expired' | 'invalid';
    memberName?: string;
    petName?: string;
    memberId?: string;
    expiryDate?: string;
    discount?: string;
  }>(null);

  const simulateScan = (type: 'valid' | 'expired' | 'invalid') => {
    if (type === 'valid') {
      setScanResult({
        status: 'valid',
        memberName: 'John Smith',
        petName: 'Max',
        memberId: 'PP-2024-8472-1653',
        expiryDate: 'Dec 25, 2025',
        discount: '15% off all products'
      });
    } else if (type === 'expired') {
      setScanResult({
        status: 'expired',
        memberName: 'Mike Roberts',
        petName: 'Rocky',
        memberId: 'PP-2023-4521-9087',
        expiryDate: 'Nov 15, 2024'
      });
    } else {
      setScanResult({
        status: 'invalid'
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Partner Dashboard | PawPass Business Portal</title>
        <meta name="description" content="Verify PawPass members and track redemptions at your business." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-slate-900 text-sm">Happy Paws Pet Shop</p>
                  <p className="text-xs text-slate-500">Partner since 2023</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Partner Dashboard
            </h1>
            <p className="text-slate-500">Verify members and track your PawPass redemptions</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Scanner */}
            <div className="lg:col-span-2 space-y-8">
              {/* Member Verification Scanner */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-primary" />
                  Member Verification
                </h2>

                {/* Scanner UI */}
                <div className="bg-slate-50 rounded-xl p-8 text-center mb-6">
                  <div className="w-32 h-32 mx-auto border-4 border-dashed border-slate-300 rounded-2xl flex items-center justify-center mb-4">
                    <ScanLine className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4">Scan member's QR code to verify eligibility</p>
                  <Button className="bg-primary hover:bg-primary/90">
                    Open Camera Scanner
                  </Button>
                </div>

                {/* Demo Buttons */}
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm text-slate-500 mb-3">Demo: Simulate scan results</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" onClick={() => simulateScan('valid')} className="border-green-300 text-green-600 hover:bg-green-50">
                      Valid Member
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => simulateScan('expired')} className="border-amber-300 text-amber-600 hover:bg-amber-50">
                      Expired Card
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => simulateScan('invalid')} className="border-red-300 text-red-600 hover:bg-red-50">
                      Invalid Code
                    </Button>
                  </div>
                </div>

                {/* Scan Result */}
                {scanResult && (
                  <div className={`mt-6 rounded-xl p-6 ${
                    scanResult.status === 'valid' ? 'bg-green-50 border border-green-200' :
                    scanResult.status === 'expired' ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      {scanResult.status === 'valid' && <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />}
                      {scanResult.status === 'expired' && <Clock className="w-8 h-8 text-amber-500 flex-shrink-0" />}
                      {scanResult.status === 'invalid' && <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />}
                      
                      <div className="flex-1">
                        <h3 className={`font-display font-semibold text-lg mb-2 ${
                          scanResult.status === 'valid' ? 'text-green-700' :
                          scanResult.status === 'expired' ? 'text-amber-700' :
                          'text-red-700'
                        }`}>
                          {scanResult.status === 'valid' && '✓ Valid Membership'}
                          {scanResult.status === 'expired' && '⚠ Membership Expired'}
                          {scanResult.status === 'invalid' && '✗ Invalid QR Code'}
                        </h3>

                        {scanResult.status !== 'invalid' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Member</p>
                              <p className="font-medium text-slate-900">{scanResult.memberName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Pet</p>
                              <p className="font-medium text-slate-900">{scanResult.petName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Member ID</p>
                              <p className="font-mono text-xs text-slate-900">{scanResult.memberId}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Expiry Date</p>
                              <p className={`font-medium ${scanResult.status === 'expired' ? 'text-red-600' : 'text-slate-900'}`}>
                                {scanResult.expiryDate}
                              </p>
                            </div>
                          </div>
                        )}

                        {scanResult.status === 'valid' && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <p className="text-green-800 font-medium">
                              🎁 Apply discount: {scanResult.discount}
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'expired' && (
                          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                            <p className="text-amber-800 text-sm">
                              Membership expired. Suggest renewal to continue enjoying discounts.
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'invalid' && (
                          <p className="text-red-600 text-sm">
                            This QR code is not recognized. Please ask the customer to show a valid PawPass membership card.
                          </p>
                        )}
                      </div>
                    </div>

                    {scanResult.status === 'valid' && (
                      <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                        Confirm Redemption
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Scans */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Verifications
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Member</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Pet</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Time</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Status</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Discount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentScans.map((scan, index) => (
                        <tr key={index} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-2 font-medium text-slate-900">{scan.member}</td>
                          <td className="py-3 px-2 text-slate-600">{scan.pet}</td>
                          <td className="py-3 px-2 text-slate-500 text-sm">{scan.time}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              scan.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {scan.status === 'valid' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {scan.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-600">{scan.discount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-display font-semibold text-slate-900 mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-slate-600">Redemptions</span>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">127</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-slate-600">New Customers</span>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">34</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Gift className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-slate-600">Discounts Given</span>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">€892</span>
                  </div>
                </div>
              </div>

              {/* Your Offer */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
                <h3 className="font-display font-semibold mb-3">Your Active Offer</h3>
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <p className="text-2xl font-display font-bold mb-1">15% OFF</p>
                  <p className="text-white/70 text-sm">All products in store</p>
                </div>
                <Button variant="secondary" size="sm" className="w-full bg-white text-slate-900 hover:bg-white/90">
                  Edit Your Offer
                </Button>
              </div>

              {/* Support */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-display font-semibold text-slate-900 mb-3">Need Help?</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Contact our partner support team for assistance with verification or billing.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BusinessDashboard;
