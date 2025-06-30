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

        // First check if we're logging in with email
        if (isset($credentials['email'])) {
            return parent::retrieveByCredentials($credentials);
        }

        // Check if we're logging in with username
        if (isset($credentials['username'])) {
            $query = $this->newModelQuery();

            $query->where('username', $credentials['username']);

            // Remove password to prevent it from being included in the query
            $credentialsWithoutPassword = array_filter(
                $credentials,
                fn ($key) => $key !== 'password',
                ARRAY_FILTER_USE_KEY
            );

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
