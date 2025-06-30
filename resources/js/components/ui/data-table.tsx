import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
    header: string;
    accessorKey: keyof T;
    cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchKey?: keyof T;
    searchPlaceholder?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
}: DataTableProps<T>) {
    const [searchValue, setSearchValue] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    // Filter data based on search
    const filteredData = React.useMemo(() => {
        if (!searchValue || !searchKey) return data;
        return data.filter((item) =>
            String(item[searchKey]).toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [data, searchValue, searchKey]);


    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const canPreviousPage = currentPage > 1;
    const canNextPage = currentPage < totalPages;

    return (
        <div className="w-full">
            {searchKey && (
                <div className="flex items-center py-4">
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="max-w-sm"
                    />
                </div>
            )}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableHead key={index}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length ? (
                            paginatedData.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map((column, colIndex) => (
                                        <TableCell key={colIndex}>
                                            {column.cell ? column.cell(row) : String(row[column.accessorKey] || '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!canPreviousPage}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!canNextPage}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
