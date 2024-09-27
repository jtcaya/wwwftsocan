<?php

namespace Application\Controllers;

use Application\Events\ReadToolsCompleted;
use Application\ReadModels\ToolsReadModel;
use Ascmvc\EventSourcing\AggregateEventListenerInterface;
use Ascmvc\EventSourcing\AggregateImmutableValueObject;
use Ascmvc\EventSourcing\AggregateRootController;
use Ascmvc\EventSourcing\Event\Event;
use Ascmvc\EventSourcing\EventDispatcher;
use Ascmvc\EventSourcing\Event\AggregateEvent;
use Ascmvc\Mvc\AscmvcEvent;

class ToolsController extends AggregateRootController implements AggregateEventListenerInterface
{
    const READ_REQUESTED = 'tools_read_received';

    // Define the Aggregate's invokable listeners.
    protected $aggregateListenerNames = [
        ToolsController::READ_REQUESTED => ToolsReadModel::class,
    ];

    public function onDispatch(AscmvcEvent $event)
    {
        $app = $event->getApplication();

        $baseConfig = $app->getBaseConfig();

        $this->view['path'] = explode('/', $app->getRequest()->getServerParams()['REQUEST_URI']);

        $this->view['env'] = $baseConfig['env'];

        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/tools-main.css';

        $this->view['js'][] = $baseConfig['URLBASEADDR'] . 'js/glob.min.js';
        $this->view['js'][] = $baseConfig['URLBASEADDR'] . 'js/web3.min.js';
    }

    /**
     * Updates the Controller's output at the dispatch event if needed (listener method).
     *
     * @param AggregateEvent $event
     */
    public function onAggregateEvent(AggregateEvent $event)
    {
        if (!$event instanceof ReadToolsCompleted) {
            return;
        }

        $eventName = $event->getName();

        $this->results = $event->getAggregateValueObject()->getProperties();

        $this->params = $event->getParams();
    }

    public function onEvent(Event $event)
    {
        return;
    }

    public function preIndexAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $toolArray['id'] = (string)$vars['get']['id'];
        } else {
            $toolArray = [];
        }

        if (!isset($this->view['page']) ) {
            $this->view['page'] = 1;      
        }
        
        $aggregateValueObject = new AggregateImmutableValueObject($toolArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            ToolsController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function indexAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->view['results'] = $this->results;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['templatefile'] = 'tools_index';

        return $this->view;
    }

    public function preUserAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $toolArray['id'] = (string)$vars['get']['id'];
        } else {
            $toolArray = [];
        }

        if (!isset($this->view['page']) ) {
            $this->view['page'] = 1;      
        }
        
        $aggregateValueObject = new AggregateImmutableValueObject($toolArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            ToolsController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function userAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];


            array_walk($this->results, function($value, $key) {
                if ($value['isdev'] === false) {
                    $this->filteredResults[$key] = $value;
                }
            });

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['templatefile'] = 'tools_index';

        return $this->view;
    }

    public function preDevAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $toolArray['id'] = (string)$vars['get']['id'];
        } else {
            $toolArray = [];
        }

        if (!isset($this->view['page']) ) {
            $this->view['page'] = 1;      
        }
        
        $aggregateValueObject = new AggregateImmutableValueObject($toolArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            ToolsController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function devAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];


            array_walk($this->results, function($value, $key) {
                if ($value['isdev'] === true) {
                    $this->filteredResults[$key] = $value;
                }
            });

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['templatefile'] = 'tools_index';

        return $this->view;
    }
}