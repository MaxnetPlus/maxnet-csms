<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;

class ExportController extends Controller
{
    public function exportSQL()
    {
        // Nama tabel yang ingin di-export
        $tables = ['customers', 'subscriptions']; // Ganti dengan nama tabel yang diinginkan

        $sqlContent = '';

        foreach ($tables as $table) {
            // Generate CREATE TABLE statement
            $createTable = $this->getCreateTableStatement($table);
            $sqlContent .= $createTable . "\n\n";

            // Generate INSERT statements
            $insertStatements = $this->getInsertStatements($table);
            $sqlContent .= $insertStatements . "\n\n";

            $sqlContent .= "-- ====================================\n\n";
        }

        // Create file response
        $fileName = 'export_' . date('Y_m_d_H_i_s') . '.sql';

        return Response::make($sqlContent, 200, [
            'Content-Type' => 'application/sql',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    private function getCreateTableStatement($tableName)
    {
        $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`")[0];
        $createStatement = $createTable->{'Create Table'};

        return "-- Structure for table `{$tableName}`\n" .
            "DROP TABLE IF EXISTS `{$tableName}`;\n" .
            $createStatement . ";";
    }

    private function getInsertStatements($tableName)
    {
        $rows = DB::table($tableName)->get();

        if ($rows->isEmpty()) {
            return "-- No data found in table `{$tableName}`";
        }

        $insertStatements = "-- Data for table `{$tableName}`\n";
        $insertStatements .= "INSERT INTO `{$tableName}` VALUES\n";

        $values = [];
        foreach ($rows as $row) {
            $rowData = [];
            foreach ($row as $value) {
                if ($value === null) {
                    $rowData[] = 'NULL';
                } elseif (is_string($value)) {
                    $rowData[] = "'" . addslashes($value) . "'";
                } else {
                    $rowData[] = $value;
                }
            }
            $values[] = '(' . implode(', ', $rowData) . ')';
        }

        $insertStatements .= implode(",\n", $values) . ';';

        return $insertStatements;
    }
}
