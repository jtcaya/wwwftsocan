<?php

namespace Application\Models\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity("Application\Models\Entity\Tools")
 * @ORM\Entity(repositoryClass="Application\Models\Repository\ToolsRepository")
 * @ORM\Table("tools")
 */
class Tools
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer", length=11)
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @ORM\Column(type="string", length=100, name="usedchains")
     */
    protected $usedchains;

    /**
     * @ORM\Column(type="string", length=100, name="appname")
     */
    protected $appname;

    /**
     * @ORM\Column(type="string", length=255, name="description")
     */
    protected $description;

    /**
     * @ORM\Column(type="boolean", length=1, name="isdev")
     */
    protected $isdev;

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return mixed
     */
    public function getIdentifier()
    {
        return $this->usedchains;
    }

    /**
     * @return mixed
     */
    public function getAppName()
    {
        return $this->appname;
    }

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @return mixed
     */
    public function getIsDev()
    {
        return $this->isdev;
    }
}
