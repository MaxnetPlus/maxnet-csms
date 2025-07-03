<?php

namespace App\Extensions;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

class UsernameOrEmailUserProvider extends EloquentUserProvider
{
    /**
     * Retrieve a user by the given credentials.
     *
     * @param array $credentials
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function retrieveByCredentials(array $credentials)
    {
        if (
            empty($credentials) ||
            (count($credentials) === 1 &&
                array_key_exists('password', $credentials))
        ) {
            return null;
        }

        // For password reset, we need to handle the 'email' field properly
        if (isset($credentials['email'])) {
            $query = $this->newModelQuery();

            // Check if it's an email format
            if (filter_var($credentials['email'], FILTER_VALIDATE_EMAIL)) {
                $query->where('email', $credentials['email']);
            } else {
                // If not email format, try username
                $query->where('username', $credentials['email']);
            }

            return $query->first();
        }

        // Handle login field (could be email or username)
        if (isset($credentials['login'])) {
            $query = $this->newModelQuery();

            $loginValue = $credentials['login'];

            // Check if it's an email format
            if (filter_var($loginValue, FILTER_VALIDATE_EMAIL)) {
                $query->where('email', $loginValue);
            } else {
                // If not email format, try username
                $query->where('username', $loginValue);
            }

            return $query->first();
        }

        // Check if we're logging in with username
        if (isset($credentials['username'])) {
            $query = $this->newModelQuery();
            $query->where('username', $credentials['username']);
            return $query->first();
        }

        return parent::retrieveByCredentials($credentials);
    }

    /**
     * Validate a user against the given credentials.
     *
     * @param \Illuminate\Contracts\Auth\Authenticatable $user
     * @param array $credentials
     * @return bool
     */
    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        $plain = $credentials['password'];

        return $this->hasher->check($plain, $user->getAuthPassword());
    }
}
