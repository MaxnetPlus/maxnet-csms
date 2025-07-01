import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Loader2, MapPin, Search, TrendingDown, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import CancelList from './CancelList';

// Fix for default markers in leaflet
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
    subscription_description: string;
    subscription_status: string;
    serv_id: string;
    lat: number | null;
    lng: number | null;
    coordinates: string;
    created_at: string;
    dismantle_at: string | null;
}

interface Stats {
    total_canceled: number;
    with_coordinates: number;
    without_coordinates: number;
}

interface Bounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface Props {
    customers: any;
    mapData: MapDataPoint[];
    stats: Stats;
    filters: {
        search?: string;
    };
}

export default function CancelSubscriptionIndex({ customers, mapData, stats, filters }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);

    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [currentMapData, setCurrentMapData] = useState<MapDataPoint[]>(mapData);
    const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<MapDataPoint | null>(null);

    // Debounce utility function
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        // Create map with Indonesia center
        const map = L.map(mapRef.current).setView([-2.5, 118], 5);
        leafletMapRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Create marker layer group
        markersRef.current = L.layerGroup().addTo(map);

        // Add event listeners for map movement with debouncing
        const updateBounds = debounce(() => {
            const bounds = map.getBounds();
            const newBounds = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            };
            setMapBounds(newBounds);
            loadMapData(newBounds, search);
        }, 300);

        map.on('moveend', updateBounds);
        map.on('zoomend', updateBounds);

        // Initial bounds update
        updateBounds();

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // Debounced load map data to prevent too many requests
    const debouncedLoadMapData = useCallback(
        debounce((bounds: Bounds | null, searchTerm: string) => {
            loadMapDataInternal(bounds, searchTerm);
        }, 500),
        [],
    );

    // Internal load map data function
    const loadMapDataInternal = useCallback(async (bounds: Bounds | null, searchTerm: string) => {
        if (!bounds) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (bounds) {
                params.append('bounds[north]', bounds.north.toString());
                params.append('bounds[south]', bounds.south.toString());
                params.append('bounds[east]', bounds.east.toString());
                params.append('bounds[west]', bounds.west.toString());
            }

            const response = await fetch(`/admin/cancel-subscription/map-data?${params}`);
            const data = await response.json();

            setCurrentMapData(data.data || []);
            updateMapMarkers(data.data || []);
        } catch (error) {
            console.error('Error loading map data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Public load map data function
    const loadMapData = useCallback(
        (bounds: Bounds | null, searchTerm: string) => {
            debouncedLoadMapData(bounds, searchTerm);
        },
        [debouncedLoadMapData],
    );

    // Update markers on map with optimization
    const updateMapMarkers = useCallback(
        (data: MapDataPoint[]) => {
            if (!markersRef.current || !leafletMapRef.current) return;

            // Clear existing markers
            markersRef.current.clearLayers();

            // Limit markers for performance (only show first 200 markers)
            const limitedData = data.slice(0, 500);

            // Batch marker creation to avoid blocking UI
            const batchSize = 50;
            let currentIndex = 0;

            const addMarkerBatch = () => {
                const endIndex = Math.min(currentIndex + batchSize, limitedData.length);

                for (let i = currentIndex; i < endIndex; i++) {
                    const point = limitedData[i];
                    if (point.lat && point.lng) {
                        // Check if this is the selected marker
                        const isSelected = selectedMarker && selectedMarker.id === point.id;

                        // Create custom icon with different colors for selected/normal markers
                        const iconUrl = isSelected
                            ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
                            : 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';

                        const iconRetinaUrl = isSelected
                            ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
                            : 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';

                        const marker = L.marker([point.lat, point.lng], {
                            icon: L.icon({
                                iconUrl: iconUrl,
                                iconRetinaUrl: iconRetinaUrl,
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41],
                            }),
                        })
                            .bindPopup(
                                `
                            <div class="p-2 max-w-xs">
                                <h3 class="font-semibold text-sm">${point.customer_name}</h3>
                                <p class="text-xs text-gray-600 mb-1"><strong>Alasan : </strong>${point.subscription_description || 'No description'}</p>
                                <p class="text-xs"><strong>Service ID:</strong> ${point.serv_id}</p>
                                <p class="text-xs"><strong>Address:</strong> ${point.subscription_address}</p>
                                <p class="text-xs"><strong>Dismantled:</strong> ${point.dismantle_at || 'N/A'}</p>
                            </div>
                        `,
                                {
                                    maxWidth: 300,
                                    className: 'custom-popup',
                                },
                            )
                            .on('click', () => {
                                setSelectedMarker(point);
                            });

                        markersRef.current?.addLayer(marker);
                    }
                }

                currentIndex = endIndex;

                // Continue with next batch if there are more markers
                if (currentIndex < limitedData.length) {
                    requestAnimationFrame(addMarkerBatch);
                }
            };

            // Start adding markers in batches
            if (limitedData.length > 0) {
                requestAnimationFrame(addMarkerBatch);
            }
        },
        [selectedMarker],
    );

    // Handle search with immediate feedback
    const handleSearch = useCallback(
        (searchTerm: string) => {
            setSearch(searchTerm);
            // Cancel any pending debounced calls and load immediately for search
            loadMapDataInternal(mapBounds, searchTerm);
        },
        [mapBounds, loadMapDataInternal],
    );

    // Handle location click from table
    const handleLocationClick = useCallback((lat: number, lng: number, data: MapDataPoint) => {
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 16);
            setSelectedMarker(data);
        }
    }, []);

    // Update markers when selected marker changes to show different colors
    useEffect(() => {
        if (currentMapData.length > 0) {
            updateMapMarkers(currentMapData);
        }
    }, [selectedMarker, currentMapData, updateMapMarkers]);

    // Handle export
    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (mapBounds) {
                params.append('bounds[north]', mapBounds.north.toString());
                params.append('bounds[south]', mapBounds.south.toString());
                params.append('bounds[east]', mapBounds.east.toString());
                params.append('bounds[west]', mapBounds.west.toString());
            }
            params.append('format', 'csv');

            const response = await fetch(`/admin/cancel-subscription/export?${params}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canceled_subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <AppLayout>
            <Head title="Cancel Subscription" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Cancel Subscription</h1>
                        <p className="text-muted-foreground">View and manage canceled subscriptions with location mapping</p>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Canceled</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_canceled.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All canceled subscriptions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">With Coordinates</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.with_coordinates.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Can be shown on map</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Without Coordinates</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.without_coordinates.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Location data missing</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Canceled Subscriptions</CardTitle>
                        <CardDescription>Search by customer name, phone, email, subscription ID, or service ID</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customers or subscriptions..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch(search);
                                        }
                                    }}
                                    className="pl-8"
                                />
                            </div>
                            <Button onClick={() => handleSearch(search)} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                            {search && (
                                <Button variant="outline" onClick={() => handleSearch('')}>
                                    Clear
                                </Button>
                            )}
                        </div>
                        {search && (
                            <div className="mt-2">
                                <Badge variant="secondary">Searching for: "{search}"</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {selectedMarker && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Selected Location Details</CardTitle>
                            <CardDescription>Information for the selected marker</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <h4 className="font-semibold">Customer Information</h4>
                                    <p>
                                        <strong>Name:</strong> {selectedMarker.customer_name}
                                    </p>
                                    <p>
                                        <strong>Phone:</strong> {selectedMarker.customer_phone}
                                    </p>
                                    <p>
                                        <strong>Email:</strong> {selectedMarker.customer_email}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Subscription Details</h4>
                                    <p>
                                        <strong>Service ID:</strong> {selectedMarker.serv_id}
                                    </p>
                                    <p>
                                        <strong>Description:</strong> {selectedMarker.subscription_description || 'N/A'}
                                    </p>
                                    <p>
                                        <strong>Address:</strong> {selectedMarker.subscription_address}
                                    </p>
                                    <p>
                                        <strong>Coordinates:</strong> {selectedMarker.coordinates}
                                    </p>
                                    <p>
                                        <strong>Dismantled:</strong> {selectedMarker.dismantle_at || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button variant="outline" onClick={() => setSelectedMarker(null)}>
                                    Close Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* Map */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Location Map</CardTitle>
                                <CardDescription>
                                    {loading ? (
                                        <span className="flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Loading map data...
                                        </span>
                                    ) : (
                                        `Showing ${currentMapData.length} canceled subscriptions`
                                    )}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{currentMapData.length} markers</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div ref={mapRef} className="h-[600px] rounded-lg border" style={{ minHeight: '600px' }} />
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50">
                                <div className="flex items-center gap-2 rounded-lg bg-white p-4 shadow-lg">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Loading markers...</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Table */}

                <CancelList initialSearch={search} mapBounds={mapBounds} onLocationClick={handleLocationClick} />

                {/* Selected Marker Details */}
            </div>
        </AppLayout>
    );
}
