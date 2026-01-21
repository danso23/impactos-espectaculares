<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;

class Controller extends BaseController
{
    
    public function instanciaPaypay(){

        // return "<script data-sdk-integration-source=\"integrationbuilder_sc\" src=\"https://www.paypal.com/sdk/js?client-id=".env('PAYPAL_CLIENT_ID')."&components=buttons\"></script>";
        return "https://www.paypal.com/sdk/js?client-id=".env('PAYPAL_CLIENT_ID')."&components=buttons";

    }
}
