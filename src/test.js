import {Graph} from "./index";

let graph = new Graph('/graph-path');

let Author = new Graph()
    .Service("Author")
    .Page(1)
    .Ref(4)//reference Author by ID
    .selectOne("name");

let posts = graph.Service("Blog").Ref(1)
    .Fetch(
        Graph.Column('title'),
        Graph.Column('author_id'),
        Author.As('author'),//fetch all authors as author
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
