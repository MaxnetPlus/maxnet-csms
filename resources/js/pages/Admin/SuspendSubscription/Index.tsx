import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Loader2, MapPin, Search, TrendingDown, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SuspendList from './SuspendList';

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
    suspend_at: string | null;
}

interface Stats {
    total_suspended: number;
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

export default function SuspendSubscriptionIndex({ customers, mapData, stats, filters }: Props) {
    // Debug log untuk melihat data awal
    console.log('Initial mapData from props:', mapData.length);
    console.log('Stats from props:', stats);

    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const { auth } = usePage().props as any;
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [currentMapData, setCurrentMapData] = useState<MapDataPoint[]>(mapData);
    const [allMapData, setAllMapData] = useState<MapDataPoint[]>(mapData); // Cache semua data marker, gunakan props sebagai initial
    const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<MapDataPoint | null>(null);
    const [isMapMoving, setIsMapMoving] = useState(false); // Track pergerakan map
    const [useClusterMode, setUseClusterMode] = useState(false); // Mode clustering untuk performa
    const [currentZoom, setCurrentZoom] = useState(5); // Track zoom level
    const [totalDataInDB, setTotalDataInDB] = useState(0); // Total data di database
    const userPermissions = auth?.user?.permissions || [];
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

        // Create map with Indonesia center and prevent scroll wheel zoom from bubbling
        const map = L.map(mapRef.current, {
            scrollWheelZoom: true,
            // Prevent map from stealing focus and causing page scroll
            keyboard: false,
            // Reduce zoom animation time for better performance
            zoomAnimationThreshold: 4,
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true,
        }).setView([-2.5, 118], 5);
        leafletMapRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Create marker layer group
        markersRef.current = L.layerGroup().addTo(map);

        // Prevent page scroll when scrolling on map
        map.getContainer().addEventListener('wheel', (e) => {
            e.stopPropagation();
        });

        // Prevent page scroll when using touch gestures on map
        map.getContainer().addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });

        map.getContainer().addEventListener('touchmove', (e) => {
            e.stopPropagation();
        });

        // Load semua data marker saat pertama kali (tanpa bounds untuk mendapatkan semua data)
        loadAllMapData(search); // Pass initial search value

        // Event listener untuk tracking pergerakan map
        map.on('movestart', () => {
            setIsMapMoving(true);
        });

        map.on('zoomstart', () => {
            setIsMapMoving(true);
        });

        // Debounced function untuk update bounds dan refresh tabel setelah map berhenti bergerak
        const updateBoundsAndTable = debounce(() => {
            const bounds = map.getBounds();
            const newBounds = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            };
            setMapBounds(newBounds);
            setIsMapMoving(false);
            // Tidak perlu load map data lagi karena sudah di-cache, hanya update bounds untuk tabel
        }, 2000); // 2 detik setelah berhenti bergerak

        map.on('moveend', updateBoundsAndTable);
        map.on('zoomend', updateBoundsAndTable);

        // Track zoom changes for clustering decisions
        map.on('zoomend', () => {
            const zoom = map.getZoom();
            setCurrentZoom(zoom);

            // Reload data if zoom changed significantly and we have many points
            if (Math.abs(zoom - currentZoom) > 2 && allMapData.length > 1000) {
                loadAllMapData(search);
            }
        });

        // Initial bounds update
        const initialBounds = map.getBounds();
        setMapBounds({
            north: initialBounds.getNorth(),
            south: initialBounds.getSouth(),
            east: initialBounds.getEast(),
            west: initialBounds.getWest(),
        });

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // Load semua data marker untuk di-cache (tanpa bounds)
    const loadAllMapData = useCallback(
        async (searchTerm?: string) => {
            setLoading(true);
            try {
                // Determine if we should use clustering based on total data
                const shouldUseCluster = totalDataInDB > 1000 || allMapData.length > 1000;

                const params = new URLSearchParams();
                if (searchTerm) params.append('search', searchTerm);

                if (shouldUseCluster && currentZoom < 12) {
                    // Use clustering for better performance
                    params.append('zoom', currentZoom.toString());
                    if (mapBounds) {
                        params.append('bounds[north]', mapBounds.north.toString());
                        params.append('bounds[south]', mapBounds.south.toString());
                        params.append('bounds[east]', mapBounds.east.toString());
                        params.append('bounds[west]', mapBounds.west.toString());
                    }

                    const response = await fetch(`/admin/suspend-subscription/clustered-map-data?${params}`);
                    const data = await response.json();

                    console.log('Using clustered data:', data.cluster_count, 'clusters for', data.total_points, 'points');

                    // Convert clusters to individual points for now (can be enhanced later)
                    const clusterData: MapDataPoint[] = [];
                    data.clusters.forEach((cluster: any) => {
                        cluster.items.forEach((item: any) => {
                            clusterData.push({
                                id: item.id,
                                customer_id: '',
                                customer_name: item.customer_name,
                                customer_phone: '',
                                customer_email: '',
                                subscription_id: item.id,
                                subscription_address: item.address,
                                subscription_description: '',
                                subscription_status: 'SUSPEND',
                                serv_id: item.serv_id,
                                lat: cluster.lat,
                                lng: cluster.lng,
                                coordinates: `${cluster.lat},${cluster.lng}`,
                                created_at: '',
                                suspend_at: null,
                            });
                        });
                    });

                    setAllMapData(clusterData);
                    setCurrentMapData(clusterData);
                    updateMapMarkers(clusterData);
                    setUseClusterMode(true);
                } else {
                    // Use regular data loading
                    params.append('all', 'true');
                    params.append('limit', '5000'); // Increased limit

                    console.log('Loading all map data with params:', params.toString());

                    const response = await fetch(`/admin/suspend-subscription/map-data?${params}`);
                    const data = await response.json();

                    console.log('Received data:', data);
                    console.log('Total records received:', data.data?.length || 0);
                    console.log('Total in DB:', data.total_in_db || 'unknown');

                    const allData = data.data || [];

                    // Update total data in DB for future decisions
                    if (data.total_in_db) {
                        setTotalDataInDB(data.total_in_db);
                    }

                    // Jika data yang diterima lebih sedikit dari data props awal, gunakan data props
                    const finalData = allData.length < mapData.length ? mapData : allData;

                    console.log('Using data:', finalData.length > allData.length ? 'props data' : 'fetched data');
                    console.log('Final total records:', finalData.length);

                    setAllMapData(finalData);
                    setCurrentMapData(finalData);
                    updateMapMarkers(finalData);
                    setUseClusterMode(false);
                }
            } catch (error) {
                console.error('Error loading all map data:', error);
            } finally {
                setLoading(false);
            }
        },
        [currentZoom, mapBounds, totalDataInDB],
    ); // Added dependencies

    // Function untuk filter data berdasarkan bounds (dari cache)
    const filterDataByBounds = useCallback(
        (bounds: Bounds | null) => {
            if (!bounds || allMapData.length === 0) return allMapData;

            const filteredData = allMapData.filter((point) => {
                if (!point.lat || !point.lng) return false;
                return point.lat >= bounds.south && point.lat <= bounds.north && point.lng >= bounds.west && point.lng <= bounds.east;
            });

            return filteredData;
        },
        [allMapData],
    );

    // Debounced load map data to prevent too many requests - hanya untuk search
    const debouncedLoadMapData = useCallback(
        debounce((searchTerm: string) => {
            loadAllMapData(searchTerm); // Pass search term sebagai parameter
        }, 300),
        [loadAllMapData],
    );

    // Public load map data function - hanya untuk search
    const loadMapData = useCallback(
        (searchTerm: string) => {
            debouncedLoadMapData(searchTerm);
        },
        [debouncedLoadMapData],
    );

    // Update markers on map with optimization
    const updateMapMarkers = useCallback(
        (data: MapDataPoint[]) => {
            if (!markersRef.current || !leafletMapRef.current) return;

            // Clear existing markers
            markersRef.current.clearLayers();

            // Adaptive marker limit based on performance
            const maxMarkers = useClusterMode ? 1000 : 3000;
            const limitedData = data.slice(0, maxMarkers);

            console.log(`Displaying ${limitedData.length} of ${data.length} total markers (cluster mode: ${useClusterMode})`);

            // Adaptive batch size based on data amount
            const batchSize = data.length > 2000 ? 200 : 100;
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
                                <p class="text-xs"><strong>Suspend:</strong> ${point.suspend_at || 'N/A'}</p>
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
                    // Use requestIdleCallback if available, otherwise use requestAnimationFrame
                    if (typeof window.requestIdleCallback === 'function') {
                        requestIdleCallback(addMarkerBatch, { timeout: 50 });
                    } else {
                        requestAnimationFrame(addMarkerBatch);
                    }
                }
            };

            // Start adding markers in batches
            if (limitedData.length > 0) {
                // Use requestIdleCallback if available for better performance
                if (typeof window.requestIdleCallback === 'function') {
                    requestIdleCallback(addMarkerBatch, { timeout: 50 });
                } else {
                    requestAnimationFrame(addMarkerBatch);
                }
            }
        },
        [selectedMarker],
    );

    // Handle search dengan reload semua data
    const handleSearch = useCallback(
        (searchTerm: string) => {
            setSearch(searchTerm);
            // Reload semua data dengan search term baru
            loadMapData(searchTerm);
        },
        [loadMapData],
    );

    // Handle location click from table
    const handleLocationClick = useCallback((lat: number, lng: number, data: MapDataPoint) => {
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 16);
            setSelectedMarker(data);
        }
    }, []);

    // Update markers saat bounds berubah (dari cache, tidak perlu request baru)
    useEffect(() => {
        if (mapBounds && !isMapMoving) {
            const filteredData = filterDataByBounds(mapBounds);
            setCurrentMapData(filteredData);
        }
    }, [mapBounds, filterDataByBounds, isMapMoving]);

    // Update markers saat search atau selectedMarker berubah
    useEffect(() => {
        if (allMapData.length > 0) {
            const dataToShow = mapBounds && !isMapMoving ? filterDataByBounds(mapBounds) : allMapData;
            updateMapMarkers(dataToShow);
        }
    }, [selectedMarker, allMapData, updateMapMarkers, mapBounds, filterDataByBounds, isMapMoving]);

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

            const response = await fetch(`/admin/suspend-subscription/export?${params}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `suspended_subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
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
            <Head title="Suspend Subscription" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Suspend Subscription</h1>
                        <p className="text-muted-foreground">View and manage suspend subscriptions with location mapping</p>
                    </div>
                    {userPermissions.includes('export-data') && (
                        <Button onClick={handleExport} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total suspended</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_suspended.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All suspended subscriptions</p>
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
                        <CardTitle>Search suspended Subscriptions</CardTitle>
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
                                    <p>
                                        <strong>Status :</strong> <Badge variant="warning">{selectedMarker.subscription_status}</Badge>
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
                                        <strong>Suspended:</strong> {selectedMarker.suspend_at || 'N/A'}
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
                                    ) : isMapMoving ? (
                                        <span className="flex items-center gap-1 text-orange-600">
                                            <MapPin className="h-3 w-3" />
                                            Map is moving... table will update in 2 seconds
                                        </span>
                                    ) : (
                                        `Showing ${currentMapData.length} of ${allMapData.length} suspended subscriptions`
                                    )}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{totalDataInDB || allMapData.length} total in DB</Badge>
                                <Badge variant="secondary">{allMapData.length} cached</Badge>
                                <Badge variant="default">{currentMapData.length} visible</Badge>
                                {useClusterMode && <Badge variant="destructive">Clustered</Badge>}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div
                            ref={mapRef}
                            className="h-[800px] rounded-lg border"
                            style={{
                                minHeight: '800px',
                                touchAction: 'none', // Prevent touch gestures from affecting page scroll
                            }}
                        />
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

                <SuspendList initialSearch={search} mapBounds={mapBounds} onLocationClick={handleLocationClick} />

                {/* Selected Marker Details */}
            </div>
        </AppLayout>
    );
}
