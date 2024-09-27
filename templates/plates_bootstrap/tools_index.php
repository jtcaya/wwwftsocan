<!DOCTYPE html>
<!--[if lt IE 7]> <html lang="en" class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]> <html lang="en" class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]> <html lang="en" class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html lang="en" class="no-js"> <!--<![endif]-->

<?php if (isset($view['headjs'])): ?>
    <?=$this->section('headjs', $this->fetch('headjs', ['view' => $view]))?>
<?php else: ?>
    <?=$this->section('head', $this->fetch('head', ['view' => $view]))?>
<?php endif ?>

<body>

<main id="MainSection" class="mx-auto h-full max-w-7xl pt-24 md:pt-12 px-4 md:px-8" role="main" data-urlbaseaddr="<?=$view['urlbaseaddr'] ?>">
    <?=$this->section('navbar_tools', $this->fetch('navbar_tools', ['view' => $view]))?>
    <section id="FAQ" class="main-section-padding">
        <div class="container">
            <h2 class="sec-title text-center"><strong>Tools</strong></h2>

            <?php if (isset($view['results'])): ?>
                <?php foreach ( $view['results'] as $key => $value ) {
                    $view['count'] = $key;
                    echo $this->section($view['results'][$key]['appname'], $this->fetch('tool_card', ['view' => $view]));
                } ?>
            <?php endif ?>
        </div>    
    </section>
    <div class="dapp-container" id="dapp-root"></div>
</main>

<?php if ($view['bodyjs'] === 1): ?>
    <?=$this->section('bodyjs', $this->fetch('bodyjs', ['view' => $view]))?>
<?php endif ?>

<script>
    var tools = <?= json_encode($view['results']); ?>;
</script>

<script>
    var dappUrlBaseAddr = <?= json_encode($view['urlbaseaddr']); ?>;
</script>

<script>
    var uriPath = <?= json_encode($view['path']); ?>;
</script>
</body>
</html>