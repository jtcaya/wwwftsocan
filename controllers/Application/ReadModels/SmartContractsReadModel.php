<?php

namespace Application\ReadModels;

use Application\Events\ReadSmartContractsCompleted;
use Ascmvc\EventSourcing\AggregateImmutableValueObject;
use Ascmvc\EventSourcing\AggregateReadModel;
use Ascmvc\EventSourcing\CommandRunner;
use Ascmvc\EventSourcing\Event\AggregateEvent;
use Ascmvc\EventSourcing\Event\Event;
use Ascmvc\EventSourcing\EventDispatcher;

class SmartContractsReadModel extends AggregateReadModel
{
    const READ_COMPLETED = 'smartcontracts_read_completed';

    protected $commandRunner;

    protected function __construct(EventDispatcher $eventDispatcher)
    {
        parent::__construct($eventDispatcher);
    }

    public static function getInstance(EventDispatcher $eventDispatcher)
    {
        return new self($eventDispatcher);
    }

    public function __invoke(AggregateEvent $event)
    {
        if (is_null($this->commandRunner)) {
            $this->onAggregateEvent($event);

            $app = $event->getApplication();

            $valuesArray = $event->getAggregateValueObject()->getProperties();

            $arguments = [];

            if (!empty($valuesArray)) {
                $values = $event->getAggregateValueObject()->serialize();

                $arguments = [
                    '--values' => $values,
                ];
            }

            $swoole = $app->isSwoole();

            $this->commandRunner = new CommandRunner($app, 'smartcontracts:read', $arguments, $swoole);
        }

        while ($this->commandRunner->start()) {
            yield true;
        }

        $processStdout = $this->commandRunner->getOutput();
        //$processStderr = $this->commandProcess->getError();

        $aggregateValueObject = new AggregateImmutableValueObject();

        if (!empty(trim($processStdout))) {
            $aggregateValueObject = $aggregateValueObject->unserialize($processStdout);
        }

        $event = new ReadSmartContractsCompleted(
            $aggregateValueObject,
            $event->getAggregateRootName(),
            SmartContractsReadModel::READ_COMPLETED
        );

        $this->eventDispatcher->dispatch($event);

        return;
    }

    public function onAggregateEvent(AggregateEvent $event)
    {
        parent::onAggregateEvent($event);
    }

    public function onEvent(Event $event)
    {
    }
}
