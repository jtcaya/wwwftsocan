<?php

use Laminas\I18n\Translator\Loader\Gettext;
//use Laminas\I18n\Translator\Translator;

$baseConfig['middleware'] = [
    function ($request, $handler) {
        if ((isset($request->getServerParams()['QUERY_STRING'])
                && (strpos($request->getServerParams()['QUERY_STRING'], 'fbclid') !== false
                    || strpos($request->getServerParams()['QUERY_STRING'], 'ref') !== false))
            || (isset($request->getServerParams()['REDIRECT_QUERY_STRING'])
                && (strpos($request->getServerParams()['REDIRECT_QUERY_STRING'], 'fbclid') !== false
                    || strpos($request->getServerParams()['REDIRECT_QUERY_STRING'], 'ref') !== false))
        ) {
            $requestUriArray = explode('?', $request->getServerParams()['REQUEST_URI']);
            
            if (empty($requestUriArray[0]) || $requestUriArray[0] === '/' || substr($requestUriArray[0], -1, 1) === '/') {
                $requestUri = '/index';
            } else {
                $requestUri = $requestUriArray[0];
            }

            $response = new \Laminas\Diactoros\Response();
            $response = $response->withStatus('302');
            $response = $response->withHeader('Location', $requestUri);
            return $response;
        }

        return $handler->handle($request);
    },
    '/en' => function ($req, $handler) {
        $app = \Ascmvc\Mvc\App::getInstance();
        $app->getSessionManager()->getSession()->set('locale', 'en_US');

        $previousUri = $app->getSessionManager()->getSession()->get('previousUri');

        if (empty($previousUri)) {
            $previousUri = '/index';
        }
        
        $response = new \Laminas\Diactoros\Response();
        $response = $response->withStatus('302');
        $response = $response->withHeader('Location', $previousUri);

        return $response;
    },
    '/fr' => function ($req, $handler) {
        $app = \Ascmvc\Mvc\App::getInstance();
        $app->getSessionManager()->getSession()->set('locale', 'fr_FR');

        $previousUri = $app->getSessionManager()->getSession()->get('previousUri');

        if (empty($previousUri)) {
            $previousUri = '/index';
        }

        $response = new \Laminas\Diactoros\Response();
        $response = $response->withStatus('302');
        $response = $response->withHeader('Location', $previousUri);

        return $response;
    },
    function ($request, $handler) {
        $app = \Ascmvc\Mvc\App::getInstance();

        $requestUriArray = explode('?', $request->getServerParams()['REQUEST_URI']);

        if (empty($requestUriArray[0]) || $requestUriArray[0] === '/' || substr($requestUriArray[0], -1, 1) === '/') {
            $requestUri = '/index';
        } else {
            $requestUri = $requestUriArray[0];
        }

        if ($requestUri !== '/en' && $requestUri !== '/fr') {
            $app->getSessionManager()->getSession()->set('previousUri', $requestUri);
        }

        if (strpos($requestUri, '/dapp') !== false) {
            $app->getSessionManager()->getSession()->set('previousUri', '/dapp/index');
        }

        return $handler->handle($request);
    },
    function ($request, $handler) {
        $app = \Ascmvc\Mvc\App::getInstance();
        $baseConfig = $app->getBaseConfig();

        $sessionLocale = $app->getSessionManager()->getSession()->get('locale');

        if ($sessionLocale === null) {
            $locale = 'en_US';
            
            if (strpos($_SERVER['HTTP_ACCEPT_LANGUAGE'], 'fr-') !== false) {
                $locale = 'fr_FR';
            }

            $app->getSessionManager()->getSession()->set('locale', $locale);

            $app->baseConfig['view']['language'] = $locale;
        } else {
            $locale = $sessionLocale;

            $app->baseConfig['view']['language'] = $locale;
        }

        putenv('LANG=' . $locale);
        setlocale(LC_ALL,"");
        setlocale(LC_MESSAGES, $locale);
        setlocale(LC_CTYPE, $locale);

        bindtextdomain("messages", $baseConfig['BASEDIR'] 
            . DIRECTORY_SEPARATOR 
            . 'locale'
        );

        textdomain("messages");

        bind_textdomain_codeset("messages", 'UTF-8');

        $app->baseConfig['view']['title'] = _("title");
        $app->baseConfig['view']['author'] = _("author");
        $app->baseConfig['view']['description'] = _("description");

        //$translator = new Translator();

        //$type = Laminas\I18n\Translator\Loader\Gettext::class;

        // $translator = Laminas\I18n\Translator\Translator::factory([
        //     'translation_file_patterns' => [
        //         [
        //             'type'     => Laminas\I18n\Translator\Loader\Gettext::class,
        //             'base_dir' => $baseConfig['BASEDIR'] . DIRECTORY_SEPARATOR . 'locale',
        //             'pattern'  => '%s' . DIRECTORY_SEPARATOR . 'LC_MESSAGES' . DIRECTORY_SEPARATOR . 'messages.mo',
        //             'text_domain' => 'messages',
        //         ],
        //     ],
        //     'locale' => $locale,
        // ]);

        //$translator->addTranslationFile($type, $filename, $textDomain, $locale);

        //$translator->translate("title", "messages", "fr_FR");

        $loader = new Gettext();

        $textDomain = $loader->load($locale, $baseConfig['BASEDIR'] . DIRECTORY_SEPARATOR . 'locale' . DIRECTORY_SEPARATOR . $locale . DIRECTORY_SEPARATOR . 'LC_MESSAGES' . DIRECTORY_SEPARATOR . 'messages.mo');

        $textDomainFilteredArray = [];

        foreach ($textDomain as $key => $value) {
            if (strpos($key, 'dapp_') !== false) { 
                $textDomainFilteredArray[$key] = $value; 
            };
        }

        $app->baseConfig['view']['jstranslate'] = json_encode($textDomainFilteredArray);

        return $handler->handle($request);
    },
    /*'/foo' => function ($req, $handler) {
        $response = new \Laminas\Diactoros\Response();
        $response->getBody()->write('FOO!');

        return $response;
    },
    function ($req, $handler) {
        if (! in_array($req->getUri()->getPath(), ['/bar'], true)) {
            return $handler->handle($req);
        }

        $response = new \Laminas\Diactoros\Response();
        $response->getBody()->write('Hello world!');

        return $response;
    },
    '/baz' => \Application\Middleware\ExampleMiddleware::class,
    '/admin' => [
        \Application\Middleware\SessionMiddleware::class,
        \Application\Middleware\ExampleMiddleware::class,
    ],*/
];
