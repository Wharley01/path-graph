import Graph from "./index";

Graph.setRequestConfig({
    withCredentials: true,
    baseURL: "http://192.168.0.148:8080",
});
let graph = new Graph('/graph-path');

// let Author = new Graph()
//     .service("Seller")
//     .page(1)
//     .ref(4)//reference Author by ID
//     .selectOne("name");

let posts = graph.service("Seller")
    .where('username')
    .isLike('sem')

posts.getAll(
    Graph.Column('username'),
    Graph.Column('instagram_id'),
).then(res => console.log(res))


/*
* [
  {
    "title": "Hello title",
    "author_id": 1,
    "author": {
      "name": "Adewale"
    }
  }
]
* */
