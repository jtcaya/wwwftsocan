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

<body id="body">
<?=$this->section('navbar', $this->fetch('navbar_landing', ['view' => $view]))?>

<main class="site-content" role="main">
    <!--
    Jumbotron
    ==================================== -->

    <section id="home-jumbotron" class="fit" style="height: 650px;">
        <div class="jumbotron jumbotron-fluid jumbotron-padding bg-img">
            <div id="container-1" class="container text-center" style="margin: 0 !important; width: 100%;">
                <img class ="jumbo-img" src="/img/Logo-Corporate-Dark.png"/>
                <div class="h1 megatext">
                    <span>FTSO Canada<br /></span>
                    <span class="lead tinytext">Start building passive income today!</span>
                </div>
            </div>
        </div>
    </section>

    <!--
    End Jumbotron
    ==================================== -->

     <!--
    Current Metrics
    ==================================== -->

    <section id="about">
        <div id="container-2" class="container text-center">
            <div class="h1 current-metrics"><strong>See our current metrics!</strong></div>
            <?php if (isset($view['results']['nodata'])): ?>
                <?=$view['results']['nodata'] ?>
            <?php else: ?>
                <?php foreach($view['results'] as $key => $networks): ?>
                    <div class="SelectedNetwork" data-value="<?=$networks['id'] ?>" data-chainidhex="<?='0x' . dechex($networks['chainid']) ?>"data-rpcurl="<?=$networks['rpcurl'] ?>" data-registrycontract="<?=$networks['registrycontract'] ?>" data-ftsocanaddr="<?=$networks['ftsocanaddr'] ?>"></div>
                <?php endforeach; ?>
                <div class="cards">
                    <div class="card" id="card-1">
                        <div class="info">
                            <a href="#" id="flr-rank"><a href="#" >%</a></a>
                            <p class="text-left">Vote Power</p>
                        </div>
                        <div class="info">
                            <a href="#" id="flr-availability"><a href="#" ></a></a>
                            <p class="text-left">Reward Rate</p>
                        </div>
                        <div class="info">
                            <a href="#" id="flr-fee">20<a href="#" >%</a></a>
                            <p class="text-left">Fee</p>
                        </div>
                    </div>
                    <div class="card" id="card-2">
                        <div class="info">
                            <a href="#" id="sgb-rank"><a href="#" >%</a></a>
                            <p class="text-left">Vote Power</p>
                        </div>
                        <div class="info">
                            <a href="#" id="sgb-availability"><a href="#" ></a></a>
                            <p class="text-left">Reward Rate</p>
                        </div>
                        <div class="info">
                            <a href="#" id="sgb-fee">20<a href="#" >%</a></a>
                            <p class="text-left">Fee</p>
                        </div>
                    </div>
                    <div class="card" id="card-3">
<!--                        <div class="info">-->
<!--                            <a href="#" id="val-delegators">20</a>-->
<!--                            <p class="text-left">Delegators</p>-->
<!--                        </div>-->
<!--                        <div class="info">-->
<!--                            <a href="#" id="val-availability">100<a href="#" >%</a></a>-->
<!--                            <p class="text-left">Availability</p>-->
<!--                        </div>-->
<!--                        <div class="info">-->
<!--                            <a href="#" id="val-fee">20<a href="#" >%</a></a>-->
<!--                            <p class="text-left">Fee</p>-->
<!--                        </div>-->
                        <div class="info">
                            <a class="text-center" style="line-height: 1">Coming Soon!</a>
                        </div>
                    </div>
                </div>
            <?php endif ?>
        </div>
    </section>

    <!--
    End Current Metrics
    ==================================== -->

    <!--
    See our DApp
    ==================================== -->

    <section id="see-dapp">
        <div id="container-3" class="container text-center">
            <div class="grid">
                <div class="row">
                    <div class="col-md-12">
                        <span class="h1 glitch-text">FTSO Can DApp</span>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <a href="#" onclick="getDocsPageNewTab(1, '<?=$view['urlbaseaddr']?>dappwrap')">
                            <img src="./img/Logo-Corporate-Light.png" alt="DApp-link" style="width: 30%; height: 30%;">
                        </a>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <a href="#" onclick="getDocsPageNewTab(1, '<?=$view['urlbaseaddr']?>dappwrap')" class="h1 glitch-text">Click here!</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!--
    End See our DApp
    ==================================== -->

     <!--
    Twitter
    ==================================== -->

    <section id="twitter">
        <div id="container-3" class="container text-center">
            <div class="grid">
                <div class="row">
                    <div class="col-md-12">
                        <span class="h1 follow-us"><strong>Follow Us!</strong></span>
                        <p class="lead follow">Stay up to date with the latest information about FTSO Canada!</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-4">
                         <blockquote class="twitter-tweet"><p lang="en" dir="ltr">FTSOCAN&#39;s validator has just begun its second round of <a href="https://twitter.com/search?q=%24FLR&amp;src=ctag&amp;ref_src=twsrc%5Etfw">$FLR</a> staking/delegation. 🚀<br><br>A warm thank you to all those that delegated their <a href="https://twitter.com/search?q=%24FLR&amp;src=ctag&amp;ref_src=twsrc%5Etfw">$FLR</a> to our validator on the first historical round of the <a href="https://twitter.com/hashtag/FlareNetwork?src=hash&amp;ref_src=twsrc%5Etfw">#FlareNetwork</a>! 🙏<br><br>Here we go! 😎<a href="https://twitter.com/hashtag/FTSO?src=hash&amp;ref_src=twsrc%5Etfw">#FTSO</a> <a href="https://twitter.com/hashtag/Flare?src=hash&amp;ref_src=twsrc%5Etfw">#Flare</a> <a href="https://twitter.com/hashtag/Validators?src=hash&amp;ref_src=twsrc%5Etfw">#Validators</a><a href="https://t.co/zIYYfqB3ZB">https://t.co/zIYYfqB3ZB</a> <a href="https://t.co/ZlQi497c4h">pic.twitter.com/ZlQi497c4h</a></p>&mdash; FTSO Canada 🇨🇦 ☀️ (@ftsocan) <a href="https://twitter.com/ftsocan/status/1723097881085677769?ref_src=twsrc%5Etfw">November 10, 2023</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                    </div>
                    <div class="col-md-4">
                         <blockquote class="twitter-tweet"><p lang="en" dir="ltr">One year ago, FTSOCAN started submitting prices on the <a href="https://twitter.com/hashtag/Flare?src=hash&amp;ref_src=twsrc%5Etfw">#Flare</a> network! 🥳<br><br>We are very proud to be playing an important role in Flare&#39;s development. 🚀<br><br>Now, onwards and upwards! ☀️<a href="https://twitter.com/hashtag/FlareNetworks?src=hash&amp;ref_src=twsrc%5Etfw">#FlareNetworks</a> <a href="https://twitter.com/hashtag/PriceProviders?src=hash&amp;ref_src=twsrc%5Etfw">#PriceProviders</a> <a href="https://twitter.com/hashtag/FTSO?src=hash&amp;ref_src=twsrc%5Etfw">#FTSO</a> <a href="https://twitter.com/hashtag/FlareCommunity?src=hash&amp;ref_src=twsrc%5Etfw">#FlareCommunity</a><a href="https://t.co/GkhE9qLZyI">https://t.co/GkhE9qLZyI</a> <a href="https://t.co/i7A7uKIWba">pic.twitter.com/i7A7uKIWba</a></p>&mdash; FTSO Canada 🇨🇦 ☀️ (@ftsocan) <a href="https://twitter.com/ftsocan/status/1684271178603548672?ref_src=twsrc%5Etfw">July 26, 2023</a></blockquote>
                    </div>
                    <div class="col-md-4">
                         <blockquote class="twitter-tweet"><p lang="en" dir="ltr">We are happy to announce that FTSOCAN has been submitting the new price pairs on the <a href="https://twitter.com/FlareNetworks?ref_src=twsrc%5Etfw">@FlareNetworks</a> since this morning, and that the transition went very smoothly, with no major outages. 🚀<a href="https://twitter.com/hashtag/Flare?src=hash&amp;ref_src=twsrc%5Etfw">#Flare</a> <a href="https://twitter.com/hashtag/FlareNetworks?src=hash&amp;ref_src=twsrc%5Etfw">#FlareNetworks</a> <a href="https://twitter.com/hashtag/FlareCommunity?src=hash&amp;ref_src=twsrc%5Etfw">#FlareCommunity</a> <a href="https://twitter.com/CommunityFlare?ref_src=twsrc%5Etfw">@CommunityFlare</a><a href="https://t.co/GkhE9qLZyI">https://t.co/GkhE9qLZyI</a> <a href="https://t.co/FE7sBAIovP">pic.twitter.com/FE7sBAIovP</a></p>&mdash; FTSO Canada 🇨🇦 ☀️ (@ftsocan) <a href="https://twitter.com/ftsocan/status/1694687398834188480?ref_src=twsrc%5Etfw">August 24, 2023</a></blockquote>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!--
    End Twitter
    ==================================== -->

</main>  <!-- /content -->

<div class="container-footer">
    <?=$this->section('footer', $this->fetch('footer', ['view' => $view]))?>
</div>

<?php if ($view['bodyjs'] === 1): ?>
    <?=$this->section('bodyjs', $this->fetch('bodyjs', ['view' => $view]))?>
<?php endif ?>

<script type="text/javascript" src="<?=$view['urlbaseaddr'] ?>js/flare-abi.js"></script>
<script type="text/javascript" src="<?=$view['urlbaseaddr'] ?>js/wnat-abi.js"></script>
<script type="text/javascript" src="<?=$view['urlbaseaddr'] ?>js/ftso-reward-abi.js"></script>
<script type="module" src="<?=$view['urlbaseaddr'] ?>js/landing-page.js"></script>
<!-- <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>  -->

<script src="<?=$view['urlbaseaddr'] ?>js/ie10-viewport-bug-workaround.js"></script>
</body>

</html>