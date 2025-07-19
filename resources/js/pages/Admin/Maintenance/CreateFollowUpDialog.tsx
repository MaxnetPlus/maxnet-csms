import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

interface Maintenance {
    ticket_id: string;
    subscription_id: string | null;
    customer_id: string;
    subject_problem: string;
    customer_report: string;
    customer: {
        customer_id: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
    };
    subscription: {
        subscription_id: string;
        subscription_description: string;
    } | null;
}

interface CreateFollowUpDialogProps {
    isOpen: boolean;
    onClose: () => void;
    maintenance: Maintenance | null;
    onFollowUpCreated: () => void;
}

export default function CreateFollowUpDialog({ isOpen, onClose, maintenance, onFollowUpCreated }: CreateFollowUpDialogProps) {
    const [formData, setFormData] = useState({
        priority: 'medium',
        description: '',
        notes: '',
        assigned_to: 'unassigned',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!maintenance) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch(route('admin.maintenances.create-follow-up', maintenance.ticket_id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Reset form
                setFormData({
                    priority: 'medium',
                    description: '',
                    notes: '',
                    assigned_to: 'unassigned',
                });
                onFollowUpCreated();
                onClose();
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({ general: data.message || 'An error occurred' });
                }
            }
        } catch (error) {
            setErrors({ general: 'Network error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleClose = () => {
        setFormData({
            priority: 'medium',
            description: '',
            notes: '',
            assigned_to: 'unassigned',
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Follow Up</DialogTitle>
                </DialogHeader>

                {maintenance && (
                    <div className="mb-4 rounded-lg bg-gray-50 p-3">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">Maintenance Details</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p>
                                <strong>Ticket ID:</strong> {maintenance.ticket_id}
                            </p>
                            <p>
                                <strong>Customer:</strong> {maintenance.customer?.customer_name}
                            </p>
                            <p>
                                <strong>Subject:</strong> {maintenance.subject_problem}
                            </p>
                            {maintenance.subscription && (
                                <p>
                                    <strong>Subscription:</strong> {maintenance.subscription.subscription_description}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{errors.general}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.priority && <p className="text-sm text-red-600">{errors.priority}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Enter follow up description..."
                            className="min-h-[100px]"
                        />
                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes..."
                            className="min-h-[80px]"
                        />
                        {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assigned_to">Assign To</Label>
                        <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {/* Add more users here if needed */}
                            </SelectContent>
                        </Select>
                        {errors.assigned_to && <p className="text-sm text-red-600">{errors.assigned_to}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Follow Up'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
