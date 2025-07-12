<?php

namespace App\Exports;

use App\Models\CustomerFollowUp;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class CustomerFollowUpExport implements FromQuery, WithHeadings, WithMapping, WithColumnFormatting
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = CustomerFollowUp::with(['customer', 'subscription', 'creator', 'assignee']);

        // Apply same filters as in controller
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($customerQuery) use ($search) {
                    $customerQuery->where('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_id', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                })
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['priority'])) {
            $query->where('priority', $this->filters['priority']);
        }

        if (!empty($this->filters['assigned_to'])) {
            $query->where('assigned_to', $this->filters['assigned_to']);
        }

        if (!empty($this->filters['date_from'])) {
            $query->where('created_at', '>=', $this->filters['date_from']);
        }

        if (!empty($this->filters['date_to'])) {
            $query->where('created_at', '<=', $this->filters['date_to'] . ' 23:59:59');
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Customer ID',
            'Customer Name',
            'Customer Email',
            'Subscription ID',
            'Priority',
            'Status',
            'Description',
            'Notes',
            'Resolution',
            'Created By',
            'Assigned To',
            'Completed At',
            'Created At',
            'Updated At',
        ];
    }

    public function map($followUp): array
    {
        return [
            $followUp->id,
            $followUp->customer_id,
            $followUp->customer?->customer_name ?? '',
            $followUp->customer?->customer_email ?? '',
            $followUp->subscription_id ?? '',
            ucfirst($followUp->priority),
            ucfirst(str_replace('_', ' ', $followUp->status)),
            $followUp->description ?? '',
            $followUp->notes ?? '',
            $followUp->resolution ?? '',
            $followUp->creator?->name ?? '',
            $followUp->assignee?->name ?? '',
            $followUp->completed_at ? $followUp->completed_at->format('Y-m-d H:i:s') : '',
            $followUp->created_at->format('Y-m-d H:i:s'),
            $followUp->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    public function columnFormats(): array
    {
        return [
            'M' => NumberFormat::FORMAT_DATE_DATETIME,
            'N' => NumberFormat::FORMAT_DATE_DATETIME,
            'O' => NumberFormat::FORMAT_DATE_DATETIME,
        ];
    }
}
