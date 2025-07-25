<?php

namespace App\Providers;

use App\Extensions\UsernameOrEmailUserProvider;
use Illuminate\Auth\AuthManager;
use Illuminate\Support\ServiceProvider;

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
