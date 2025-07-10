<?php

namespace App\Providers;

use App\Extensions\UsernameOrEmailUserProvider;
use Illuminate\Auth\AuthManager;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Only force HTTPS if we're sure we're behind HTTPS
        // Let the server/proxy handle the HTTPS redirection
        if (config('app.env') === 'production' && config('app.url') && str_starts_with(config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        $this->registerAuthProvider();
    }

    /**
     * Register the custom auth provider.
     */
    protected function registerAuthProvider(): void
    {
        $this->app->make(AuthManager::class)->provider(
            'username-email',
            function ($app, array $config) {
                return new UsernameOrEmailUserProvider(
                    $app['hash'],
                    $config['model']
                );
            }
        );
    }
}
