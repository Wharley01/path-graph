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
import {Graph} from "@__path/graph";

let graph = new Graph('/graph-path');//the root instance

let Author = new Graph()
    .Service("Author")//service can created using "./__path create controller <ServiceName> --graph"
    .Ref(4)//reference Author by ID(Optional)
    .fetchAll("name");//column to fetch, can be Graph.Column('name')

let posts = graph.Service("Blog").Ref(1)//reference Blog with id 1
    .fetchAll(
        Graph.Column('title'),
        Graph.Column('author_id'),
        Author.As('author'),//fetch Author instance(Service) as author(key)
        Graph.Column('body')
    );

posts.get().then(res => console.log(res))
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


```