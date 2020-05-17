import {Graph} from "./index";

let graph = new Graph('/graph-path');

let Author = new Graph()
    .service("Author")
    .page(1)
    .ref(4)//reference Author by ID
    .selectOne("name");

let posts = graph.service("Blog").ref(1)
    .fetch(
        Graph.Column('title'),
        Graph.Column('author_id'),
        Author.as('author'),//fetch all authors as author
        Graph.Column('body')
    );

posts.getAll().then(res => console.log(res))
// /query?fetch=title,description,author:Authors/getOne&from=BlogPosts&id=1

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
