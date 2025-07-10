<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only redirect to HTTPS in production and if not already HTTPS
        if (config('app.env') === 'production' && !$request->isSecure()) {
            // Check if we're behind a proxy that's already handling HTTPS
            $forwardedProto = $request->header('X-Forwarded-Proto');

            if ($forwardedProto !== 'https') {
                return redirect()->secure($request->getRequestUri(), 301);
            }
        }

        return $next($request);
    }
}
