// 2. This code loads the IFrame Player API code asynchronously.
var socket = io("https://huytap.github.io");
var videoId = 0;
var player;
//onload get list
socket.on('server-getdata',async function(data){
    $('#list').html('');
    await $.each(data, function(i, j){
        if(j.current === 1){
            //$('#youtube').attr('src', 'https://www.youtube.com/embed/'+j.link+'?autoplay=1');
            videoId = j.link;
        }
        $('#list').append('<li data-link="'+j.link+'" '+(j.current === 1 ? 'class="active"' : '')+'><span>'+j.name+'</span> <span class="glyphicon glyphicon-remove"></span></span></li>')
    });
    $('#txtLink').val('');
    $('#txtLink').focus();
    await removeClip();
    await selectClip();
})
//add clip
socket.on('server-addclip', function(data){
    $('#list').append('<li data-link="'+data.link+'"><span>'+data.name+'</span> <span class="glyphicon glyphicon-remove"></span></span></li>')
})
//add clip fail
socket.on('server-addclip-fail', function(message){
    alert(message);
    $('#txtLink').val('');
    $('#txtLink').focus();
})
//remove clip
socket.on('server-removeclip', function(data){
    $('#list').find('li[data-link="'+data+'"]').remove();
})
//select clip
socket.on('server-selectclip', function(data){
    videoId = data;
    player.cueVideoById(videoId)
    player.playVideo();
    //$('#youtube').attr('src', 'https://www.youtube.com/embed/'+data+'?autoplay=1');
    $('#list').find('li').removeClass('active');
    
    $('#list').find('li[data-link="'+data+'"]').addClass('active')
})
//error
socket.on('server-getdata-fail', function(data){
    console.log(data)
})
$(document).ready(function(){
    //on first loading
    socket.emit("client-getdata");
    //client send add clip
    $('#btnAdd').click(function(){
        socket.emit('client-addclip', $('#txtLink').val())
    });
})

//remove clip
function removeClip(){
    $('#list').find('li').each(function(i,j){
        $(j).find('span.glyphicon').click(function(){
            if(confirm('Bạn có chắc chắn muốn xóa clip này?'))
                socket.emit('client-removeclip', $(this).parent().attr('data-link'))
        })
    });
}

//select clip
function selectClip(){
    $('#list').find('li').each(function(i,j){
        $(j).find('span:first-child').click(function(){
            socket.emit('client-selectclip', $(this).parent().attr('data-link'));
        })
    });
}

//clip loading
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube', {
        height: '450',
        width: '100%',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if(event.data === 0){
        let nextVideo = $('#list').find('li.active').next().attr('data-link');
        socket.emit('client-selectclip', nextVideo);
    }
}
function stopVideo() {
    player.stopVideo();
}
