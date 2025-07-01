import { AppLayout } from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, Input, Progress } from '@/components/ui';
import { BreadcrumbItem } from '@/types';
import { Customer, Subscription } from '@/types';
import { MapPin, Search, Users, AlertCircle, Filter, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapDataPoint {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    subscription_id: string;
    subscription_address: string;
    subscription_status: string;
    serv_id: string;
    lat: number;
    lng: number;
    coordinates: string;
    created_at: string;
    dismantle_at: string | null;
}

interface Props {
    customers: Customer[];
    mapData: MapDataPoint[];
    stats: {
        total_canceled: number;
        with_coordinates: number;
        without_coordinates: number;
    };
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cancel Subscription', href: '/admin/cancel-subscription' },
];

export default function CancelSubscriptionIndex({ customers, mapData, stats, filters }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);
    const [filteredData, setFilteredData] = useState<MapDataPoint[]>(mapData);
    const [isLoadingMapData, setIsLoadingMapData] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<MapDataPoint | null>(null);

    const { data, setData, get, processing } = useForm({
        search: filters.search || '',
    });

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Create map
        const map = L.map(mapRef.current).setView([-2.5489, 118.0149], 5); // Indonesia center

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Create markers layer
        const markers = L.layerGroup().addTo(map);

        leafletMap.current = map;
        markersLayer.current = markers;

        // Add map event listeners
        map.on('moveend zoomend', handleMapBoundsChange);

        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        };
    }, []);

    // Update markers when data changes
    useEffect(() => {
        updateMarkers(filteredData);
    }, [filteredData]);

    // Handle map bounds change
    const handleMapBoundsChange = async () => {
        if (!leafletMap.current) return;

        setIsLoadingMapData(true);
        const bounds = leafletMap.current.getBounds();
        
        try {
            const response = await fetch('/admin/cancel-subscription/map-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    bounds: {
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest(),
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setFilteredData(data);
            }
        } catch (error) {
            console.error('Error fetching map data:', error);
        } finally {
            setIsLoadingMapData(false);
        }
    };

    // Update markers on map
    const updateMarkers = (data: MapDataPoint[]) => {
        if (!markersLayer.current) return;

        // Clear existing markers
        markersLayer.current.clearLayers();

        // Add new markers
        data.forEach((point) => {
            const marker = L.marker([point.lat, point.lng])
                .bindPopup(`
                    <div class="p-2">
                        <h3 class="font-semibold text-sm">${point.customer_name}</h3>
                        <p class="text-xs text-gray-600">ID: ${point.customer_id}</p>
                        <p class="text-xs text-gray-600">Subscription: ${point.subscription_id}</p>
                        <p class="text-xs text-gray-600">Service: ${point.serv_id}</p>
                        <p class="text-xs text-gray-600">Phone: ${point.customer_phone}</p>
                        <p class="text-xs text-gray-600">Address: ${point.subscription_address || 'N/A'}</p>
                        <p class="text-xs text-gray-600">Coordinates: ${point.coordinates}</p>
                        ${point.dismantle_at ? `<p class="text-xs text-red-600">Dismantled: ${point.dismantle_at}</p>` : ''}
                    </div>
                `)
                .on('click', () => {
                    setSelectedMarker(point);
                });

            markersLayer.current?.addLayer(marker);
        });
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        get(route('admin.cancel-subscription.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Clear search
    const clearSearch = () => {
        setData('search', '');
        get(route('admin.cancel-subscription.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Table columns
    const columns = [
        {
            header: 'Customer',
            accessorKey: 'customer_name' as keyof MapDataPoint,
            cell: (data: MapDataPoint) => (
                <div>
                    <p className="font-medium">{data.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{data.customer_id}</p>
                </div>
            ),
        },
        {
            header: 'Contact',
            accessorKey: 'customer_phone' as keyof MapDataPoint,
            cell: (data: MapDataPoint) => (
                <div>
                    <p className="text-sm">{data.customer_phone}</p>
                    <p className="text-sm text-muted-foreground">{data.customer_email || 'N/A'}</p>
                </div>
            ),
        },
        {
            header: 'Subscription',
            accessorKey: 'subscription_id' as keyof MapDataPoint,
            cell: (data: MapDataPoint) => (
                <div>
                    <p className="font-medium">{data.subscription_id}</p>
                    <p className="text-sm text-muted-foreground">Service: {data.serv_id}</p>
                </div>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'subscription_status' as keyof MapDataPoint,
            cell: (data: MapDataPoint) => (
                <Badge variant="destructive">
                    {data.subscription_status}
                </Badge>
            ),
        },
        {
            header: 'Location',
            accessorKey: 'coordinates' as keyof MapDataPoint,
            cell: (data: MapDataPoint) => (
                <div>
                    <p className="text-sm font-mono">{data.coordinates}</p>
                    <p className="text-xs text-muted-foreground">{data.subscription_address || 'N/A'}</p>
                </div>
            ),
        },
        {
            header: 'Date',
            accessorKey: 'created_at' as keyof MapDataPoint,
            cell: (data: MapDataPoint) => (
                <div>
                    <p className="text-sm">Created: {data.created_at}</p>
                    {data.dismantle_at && (
                        <p className="text-sm text-red-600">Dismantled: {data.dismantle_at}</p>
                    )}
                </div>
            ),
        },
        {
            header: 'Actions',
            cell: (data: MapDataPoint) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (leafletMap.current) {
                            leafletMap.current.setView([data.lat, data.lng], 15);
                            setSelectedMarker(data);
                        }
                    }}
                >
                    <MapPin className="h-4 w-4 mr-1" />
                    View on Map
                </Button>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cancel Subscription" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Cancel Subscription</h1>
                        <p className="text-muted-foreground">View canceled subscriptions with location mapping</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Canceled</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_canceled}</div>
                            <p className="text-xs text-muted-foreground">Subscriptions canceled</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">With Coordinates</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.with_coordinates}</div>
                            <p className="text-xs text-muted-foreground">Locations mapped</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Without Coordinates</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.without_coordinates}</div>
                            <p className="text-xs text-muted-foreground">No location data</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search & Filter</CardTitle>
                        <CardDescription>Filter customers and subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by customer name, ID, email, or phone..."
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Search className="h-4 w-4 mr-2" />
                                )}
                                Search
                            </Button>
                            {data.search && (
                                <Button type="button" variant="outline" onClick={clearSearch}>
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Map */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location Map
                            {isLoadingMapData && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                        </CardTitle>
                        <CardDescription>
                            Interactive map showing canceled subscription locations. Zoom to filter data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div ref={mapRef} className="h-96 w-full rounded-md border" />
                        {selectedMarker && (
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <h4 className="font-semibold">Selected Location</h4>
                                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p><strong>Customer:</strong> {selectedMarker.customer_name}</p>
                                        <p><strong>ID:</strong> {selectedMarker.customer_id}</p>
                                        <p><strong>Phone:</strong> {selectedMarker.customer_phone}</p>
                                    </div>
                                    <div>
                                        <p><strong>Subscription:</strong> {selectedMarker.subscription_id}</p>
                                        <p><strong>Service:</strong> {selectedMarker.serv_id}</p>
                                        <p><strong>Coordinates:</strong> {selectedMarker.coordinates}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Canceled Subscriptions Data</CardTitle>
                        <CardDescription>
                            Detailed view of all canceled subscriptions with location coordinates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={filteredData} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
