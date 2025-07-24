<?php

namespace App\Exports;

use App\Services\SalesPerformanceService;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class SalesPerformanceReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected $filters;
    protected $salesPerformanceService;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
        $this->salesPerformanceService = new SalesPerformanceService();
    }

    public function collection()
    {
        return $this->salesPerformanceService->getPerformanceReportForExport($this->filters);
    }

    public function headings(): array
    {
        return [
            'ID Sales',
            'Nama Sales',
            'Email',
            'Total Poin',
            'Total Prospek',
            'Prospek Terkonversi',
            'Target Bulanan',
            'Pencapaian (%)',
        ];
    }

    public function map($row): array
    {
        return [
            $row->sales_id,
            $row->sales_name,
            $row->sales_email,
            $row->total_points,
            $row->total_prospects,
            $row->total_converted,
            $row->monthly_target,
            $row->achievement_percentage . '%',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text.
            1 => ['font' => ['bold' => true]],

            // Set alignment for all cells
            'A:H' => [
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12,
            'B' => 25,
            'C' => 30,
            'D' => 15,
            'E' => 15,
            'F' => 18,
            'G' => 18,
            'H' => 15,
        ];
    }
}
