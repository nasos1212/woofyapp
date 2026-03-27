import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Upload, FileText, Trash2, Eye, Loader2, Plus, File, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateDocumentFile } from "@/lib/fileValidation";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";
import Header from "@/components/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PetDocument {
  id: string;
  pet_id: string;
  title: string;
  document_url: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_type: string;
}

const PetDocuments = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasMembership } = useMembership();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const petId = searchParams.get("pet");

  const [pet, setPet] = useState<Pet | null>(null);
  const [documents, setDocuments] = useState<PetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string; type: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && petId) {
      fetchPetAndDocuments();
    }
  }, [user, petId]);

  const fetchPetAndDocuments = async () => {
    if (!petId) return;
    setIsLoading(true);
    try {
      const [petRes, docsRes] = await Promise.all([
        supabase.from("pets").select("id, pet_name, pet_type").eq("id", petId).maybeSingle(),
        supabase.from("pet_documents").select("*").eq("pet_id", petId).order("created_at", { ascending: false }),
      ]);

      if (petRes.error) throw petRes.error;
      if (docsRes.error) throw docsRes.error;

      setPet(petRes.data);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || !user || !petId) return;

    setIsUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${petId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("pet-documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("pet_documents").insert({
        pet_id: petId,
        owner_user_id: user.id,
        title: title.trim(),
        document_url: filePath,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
      });

      if (dbError) throw dbError;

      toast.success("Document uploaded!");
      setTitle("");
      setSelectedFile(null);
      setShowUploadForm(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchPetAndDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async (doc: PetDocument) => {
    setIsLoadingPreview(true);
    try {
      const { data, error } = await supabase.storage
        .from("pet-documents")
        .createSignedUrl(doc.document_url, 3600);

      if (error) throw error;

      const extension = doc.file_name.split('.').pop()?.toLowerCase() || '';
      const fileType = ['pdf'].includes(extension) ? 'pdf'
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? 'image'
        : 'other';

      setPreviewDocument({
        url: data.signedUrl,
        title: doc.title,
        type: fileType
      });
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDelete = async (doc: PetDocument) => {
    try {
      await supabase.storage.from("pet-documents").remove([doc.document_url]);
      const { error } = await supabase.from("pet_documents").delete().eq("id", doc.id);
      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes("pdf")) return "📄";
    if (fileType?.includes("image")) return "🖼️";
    if (fileType?.includes("word") || fileType?.includes("document")) return "📝";
    return "📎";
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pet Not Found</h2>
            <p className="text-muted-foreground mb-4">Select a pet to view their documents.</p>
            <Button onClick={() => navigate("/member")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pet.pet_name}'s Documents | Wooffy</title>
        <meta name="description" content={`Manage ${pet.pet_name}'s general documents like certificates and registrations.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background overflow-x-hidden">
        <Header />

        <main className="w-full max-w-2xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))]">
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/member" },
                { label: pet.pet_name, href: `/member/pet/${pet.id}` },
                { label: "Documents" },
              ]}
            />
          </div>

          <Button variant="ghost" onClick={() => navigate(`/member/pet/${pet.id}`)} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to {pet.pet_name}
          </Button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {pet.pet_name}'s Documents
            </h1>
            <Button onClick={() => setShowUploadForm(!showUploadForm)} className="gap-2" size="sm">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upload Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Document Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Birth Certificate, Registration, Passport..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <File className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select a file</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WebP, DOC up to 10MB</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setTitle("");
                      setSelectedFile(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile || !title.trim()}
                    className="flex-1 gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No documents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload certificates, registrations, or other important documents for {pet.pet_name}.
                </p>
                {!showUploadForm && (
                  <Button onClick={() => setShowUploadForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Upload First Document
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0 mt-0.5">{getFileIcon(doc.file_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{doc.title}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(doc)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleView(doc)}
                          >
                            <File className="w-4 h-4" />
                            View Document
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Document Preview Modal */}
        <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center justify-between pr-8">
                <DialogTitle className="text-lg font-semibold truncate">
                  {previewDocument?.title} - Document
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => previewDocument && window.open(previewDocument.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    asChild
                  >
                    <a href={previewDocument?.url} download>
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-muted/30">
              {isLoadingPreview ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : previewDocument?.type === 'pdf' ? (
                <iframe
                  src={previewDocument.url}
                  className="w-full h-full border-0"
                  title="Document Preview"
                />
              ) : previewDocument?.type === 'image' ? (
                <div className="h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={previewDocument.url}
                    alt="Document"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <File className="w-16 h-16 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Preview not available</p>
                    <p className="text-sm text-muted-foreground">
                      This file type cannot be previewed. Download the file to view it.
                    </p>
                  </div>
                  <Button asChild>
                    <a href={previewDocument?.url} download className="gap-2">
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PetDocuments;
