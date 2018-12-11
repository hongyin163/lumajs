

lumajs.config({
    baseUrl: 'http://localhost:8081/dist/',
    env: 'development',
    // comboHandler: 'http://localhost:3000/',
    localStore: false,
    externals: {
        'React': 'React'
    }
});

// var start = new Date().getTime()
// lumajs.use(['./person.js'], function (Person) {
//     var end = new Date().getTime();
//     console.log(end - start);

//     ReactDOM.render(
//         <Person/>,
//         document.getElementById('main')
//     );
// });
// window.React={A:1};
lumajs.use(['./fish.js'], function (fish,car) {
    // console.log(plane.say());
});
