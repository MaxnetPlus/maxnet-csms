<?php

namespace App\Providers;

use App\Extensions\UsernameOrEmailUserProvider;
use Illuminate\Auth\AuthManager;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

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
        // Force HTTPS in production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Force HTTPS if behind proxy (common in shared hosting)
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
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
