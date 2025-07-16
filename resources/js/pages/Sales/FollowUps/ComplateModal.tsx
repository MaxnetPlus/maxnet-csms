import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { CheckSquare } from 'lucide-react';
import { useState } from 'react';

interface ComplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    followUpId: number;
    customerName: string;
}

export default function ComplateModal({ isOpen, onClose, followUpId, customerName }: ComplateModalProps) {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!notes.trim()) {
            setError('Notes wajib diisi (minimal 10 karakter)');
            return;
        }

        if (notes.trim().length < 10) {
            setError('Notes minimal harus 10 karakter');
            return;
        }

        setIsSubmitting(true);
        setError('');

        router.post(
            `/sales/follow-ups/${followUpId}/complete`,
            {
                resolution: 'Follow up selesai dikerjakan',
                notes: notes.trim(),
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setNotes('');
                    onClose();
                    router.reload();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    console.error('Error completing follow up:', errors);
                    setError('Terjadi kesalahan saat menyelesaikan follow up.');
                },
            },
        );
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setNotes('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-green-600" />
                        Selesaikan Follow Up
                    </DialogTitle>
                    <DialogDescription>
                        Anda akan menyelesaikan follow up untuk customer <strong>{customerName}</strong>. Silakan masukkan catatan mengenai hasil
                        follow up ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">
                            Catatan Follow Up <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Masukkan catatan hasil follow up (minimal 10 karakter)..."
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                if (error) setError('');
                            }}
                            rows={4}
                            className={error ? 'border-red-500' : ''}
                            disabled={isSubmitting}
                        />
                        <div className="flex items-center justify-between">
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <p className={`ml-auto text-xs ${notes.length < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                {notes.length}/10 karakter minimal
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-background dark:text-white">
                        <p className="mb-1 font-medium">Tips:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• Jelaskan hasil komunikasi dengan customer</li>
                            <li>• Catat respon atau feedback yang diberikan</li>
                            <li>• Tuliskan tindak lanjut yang diperlukan (jika ada)</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !notes.trim() || notes.trim().length < 10}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span>Menyimpan...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-4 w-4" />
                                <span>Selesaikan Follow Up</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
