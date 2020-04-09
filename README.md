## Installation

After navigating into your project folder, Run:

```bash
$ yarn add @__path/graph
```

or:

```bash
$ npm install @__path/graph --save
```

Usage Example:

```javascript
import { Graph } from "@__path/graph";

let graph = new Graph("/graph-path"); //the root instance

let Author = new Graph()
  .Service("Author") //service can created using "./__path create controller <ServiceName> --graph"
  .fetchAll("name"); //column to fetch, can be Graph.Column('name')

let posts = graph.Service("Blog").fetchAll(
  Graph.Column("title"),
  Graph.Column("author_id"),
  Author.As("author"), //fetch Author instance(Service) as author(key)
  Graph.Column("body")
);

posts.get().then((res) => console.log(res));

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
```
