<?php

namespace Application\Models\Repository;

use Application\Models\Entity\Tools;
use Doctrine\ORM\EntityRepository;

class ToolsRepository extends EntityRepository
{

    protected $tools;

    public function findAll()
    {
        $results = $this->findBy([], ['id' => 'ASC']);

        for ($i = 0; $i < count($results); $i++) {
            $results[$i] = $this->hydrateArray($results[$i]);
        }

        return $results;
    }

    public function delete(Tools $tools)
    {
        $this->tools = $tools;

        try {
            $this->_em->remove($this->tools);
            $this->_em->flush();
        } catch (\Exception $e) {
            throw new \Exception('Database not available');
        }
    }

    public function hydrateArray(Tools $tools)
    {
        $array['id'] = $tools->getId();
        $array['chainidentifiers'] = $tools->getIdentifier();
        $array['appname'] = $tools->getAppName();
        $array['description'] = $tools->getDescription();
        $array['isdev'] = $tools->getIsDev();

        return $array;
    }
}
