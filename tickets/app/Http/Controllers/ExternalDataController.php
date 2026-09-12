<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ExternalDataController extends Controller
{
    public function weather(): JsonResponse
    {
        $weather = Cache::remember('external.weather.belgrade', 600, function () {
            return Http::timeout(8)->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => 44.8125,
                'longitude' => 20.4612,
                'current' => 'temperature_2m,relative_humidity_2m,weather_code',
                'timezone' => 'Europe/Belgrade',
            ])->throw()->json();
        });

        return response()->json([
            'source' => 'Open-Meteo',
            'city' => 'Beograd',
            'data' => $weather,
        ]);
    }

    public function exchangeRate(): JsonResponse
    {
        $rates = Cache::remember('external.exchange.eur.rsd', 3600, function () {
            return Http::timeout(8)
                ->get('https://api.frankfurter.app/latest', ['from' => 'EUR', 'to' => 'RSD'])
                ->throw()
                ->json();
        });

        return response()->json([
            'source' => 'Frankfurter',
            'data' => $rates,
        ]);
    }
}
