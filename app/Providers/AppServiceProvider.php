<?php

namespace App\Providers;

use App\Extensions\UsernameOrEmailUserProvider;
use Illuminate\Auth\AuthManager;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

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
        // Set default string length for older MySQL versions
        Schema::defaultStringLength(191);

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
