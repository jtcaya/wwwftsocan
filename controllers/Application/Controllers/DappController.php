<?php

namespace Application\Controllers;

use Application\Events\ReadNetworksCompleted;
use Application\ReadModels\NetworksReadModel;
use Ascmvc\EventSourcing\AggregateEventListenerInterface;
use Ascmvc\EventSourcing\AggregateImmutableValueObject;
use Ascmvc\EventSourcing\AggregateRootController;
use Ascmvc\EventSourcing\Event\Event;
use Ascmvc\EventSourcing\EventDispatcher;
use Ascmvc\EventSourcing\Event\AggregateEvent;
use Ascmvc\Mvc\AscmvcEvent;

class DappController extends AggregateRootController implements AggregateEventListenerInterface
{
    const READ_REQUESTED = 'networks_read_received';

    // Define the Aggregate's invokable listeners.
    protected $aggregateListenerNames = [
        DappController::READ_REQUESTED => NetworksReadModel::class,
    ];

    public function onDispatch(AscmvcEvent $event)
    {
        $app = $event->getApplication();

        $baseConfig = $app->getBaseConfig();

        $this->view['path'] = explode('/', $app->getRequest()->getServerParams()['REQUEST_URI']);

        $this->view['dappName'] = $baseConfig['dappName'];
        $this->view['env'] = $baseConfig['env'];
        $this->view['dappActive'] = $baseConfig['dappActive'];

        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-main.css';

        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-wrap.css';
        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-delegate.css';
        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-claim.css';
        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-stake.css';
        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-stake-transfer.css';
        $this->view['css'][] = $baseConfig['URLBASEADDR'] . 'css/dapp-stake-stake.css';

        $this->view['js'][] = $baseConfig['URLBASEADDR'] . 'js/glob.min.js';
        $this->view['js'][] = $baseConfig['URLBASEADDR'] . 'js/web3.min.js';
        $this->view['jsconfig']['ftsov2']['fetchtupleconfig'] = 
            file_get_contents(
                $baseConfig['BASEDIR'] 
                . DIRECTORY_SEPARATOR 
                .'config' 
                . DIRECTORY_SEPARATOR 
                . 'tupleconfig.json'
            );

        // $this->view['jsdefer'][] = $baseConfig['URLBASEADDR'] . 'js/flare/avalanche.js';
        // $this->view['jsdefer'][] = $baseConfig['URLBASEADDR'] . 'js/flare/index.js';
    }

    /**
     * Updates the Controller's output at the dispatch event if needed (listener method).
     *
     * @param AggregateEvent $event
     */
    public function onAggregateEvent(AggregateEvent $event)
    {
        if (!$event instanceof ReadNetworksCompleted) {
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
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function indexAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappwrap'] = 1;

        $this->view['templatefile'] = 'dapp_index';

        return $this->view;
    }

    public function preWrapAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function wrapAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappwrap'] = 1;

        $this->view['templatefile'] = 'dapp_wrap';

        return $this->view;
    }

    public function preDelegateAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function delegateAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappdelegate'] = 1;

        $this->view['templatefile'] = 'dapp_delegate';

        return $this->view;
    }

    public function preClaimAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function claimAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappclaim'] = 1;

        $this->view['templatefile'] = 'dapp_claim';

        return $this->view;
    }

    public function preWalletAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function walletAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        // $this->view['headjsdefer'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappstake'] = 1;

        $this->view['templatefile'] = 'dapp_wallet';

        return $this->view;
    }

    public function preStakeTransferAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function stakeTransferAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        // $this->view['headjsdefer'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappstake'] = 1;

        $this->view['templatefile'] = 'dapp_stake_transfer';

        return $this->view;
    }

    public function preStakeStakeAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function stakeStakeAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        // $this->view['headjsdefer'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappstake'] = 1;

        $this->view['templatefile'] = 'dapp_stake_stake';

        return $this->view;
    }

    public function preStakeRewardsAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function stakeRewardsAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        // $this->view['headjsdefer'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappstake'] = 1;

        $this->view['templatefile'] = 'dapp_stake_rewards';

        return $this->view;
    }

    public function preWalletMetamaskAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function walletMetamaskAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        // $this->view['headjsdefer'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappstake'] = 1;

        $this->view['templatefile'] = 'dapp_wallet_metamask';

        return $this->view;
    }

    public function preWalletLedgerAction($vars = null)
    {
        if (isset($vars['get']['id'])) {
            $networkArray['id'] = (string)$vars['get']['id'];
        } else {
            $networkArray = [];
        }

        $aggregateValueObject = new AggregateImmutableValueObject($networkArray);

        $event = new AggregateEvent(
            $aggregateValueObject,
            $this->aggregateRootName,
            DappController::READ_REQUESTED
        );

        $this->eventDispatcher->dispatch($event);
    }

    public function walletLedgerAction($vars = null)
    {
        if (isset($this->results) && !empty($this->results)) {
            $this->filteredResults = [];
            $networkSymbols = [];

            if ($this->view['env'] === 'production') {
                $networkSymbols = ['FLR', 'SGB'];
            } else {
                $networkSymbols = ['CFLR', 'C2FLR'];
            }

            array_walk($this->results, function($value, $key, $symbol) {
                foreach ($symbol as $networkSymbol) {
                    if ($value['chainidentifier'] === $networkSymbol) {
                        $this->filteredResults[$key] = $value;
                    }
                }
            }, $networkSymbols);

            $this->view['results'] = $this->filteredResults;
        } else {
            $this->view['results']['nodata'] = 'No results';
        }

        $this->view['headjs'] = 1;

        // $this->view['headjsdefer'] = 1;

        $this->view['bodyjs'] = 1;

        $this->view['dappstake'] = 1;

        $this->view['templatefile'] = 'dapp_wallet_ledger';

        return $this->view;
    }
}