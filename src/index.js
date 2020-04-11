import axios from "axios";
export class Response {
  constructor(res = {
    data: null,
    msg: "",
    status: 0
  }) {
    this.raw_response = res;
  }
  getData() {
    if (typeof this.raw_response['data'] !== 'undefined') {
      return this.raw_response.data;
    } else {
      return null
    }
  }


  getMsg() {
    if (typeof this.raw_response.msg !== 'undefined') {
      return this.raw_response.msg;
    } else {
      return null;
    }
  }

  getNetworkErrorMsg() {
    if (typeof this.raw_response['network_msg'] !== 'undefined') {
      return this.raw_response.network_msg;
    } else {
      return null;
    }
  }


  getStatus() {
    if (typeof this.raw_response.status !== 'undefined') {
      return this.raw_response.status;
    } else {
      return 0;
    }
  }

  getTotalPages() {
    if (typeof this.raw_response.current_page !== 'undefined') {
      return this.raw_response.current_page;
    } else {
      return 1;
    }
  }

  getCurrentPage() {
    if (typeof this.raw_response.current_page !== 'undefined') {
      return this.raw_response.current_page;
    } else {
      return 1;
    }
  }

}
export default class Graph {

  constructor(){
    this.auto_link = false;
    this.queryTree = {
      service_name: null,
      service_method: null,
      columns: [],
      alias: null,
      id: null,
      page: 1,
      params: {},
      queries: {},
      filters: {},
      post_params: {},
    };
  }

  static endpoint = '/path-graph';

  static requestConfig = {};

  static setRequestConfig(config) {
    Graph.requestConfig = {
      ...Graph.requestConfig,
      ...config
    };
  };

  AutoLink() {
    this.auto_link = true;
    return this;
  }

  Service(service) {
    service = service.split('/');

    this.queryTree.service_name = service[0];
    if(typeof service[1] !== 'undefined'){
      this.Func(service[1])
    }
    return this;
  }

  Where(conditions) {
    this.queryTree.filters = {
      ...this.queryTree.filters,
      ...conditions
    }
    return this;
  }

  Ref(id) {
    this.queryTree.filters = {
      ...this.queryTree.filters,
      ...{
        id
      }
    }
    return this;
  }

  Page(page) {
    if (isNaN(page)) {
      throw new Error('Page must be a valid number');
    }
    this.queryTree.page = parseInt(page);
    return this;
  }

  static Column(column) {
    if (/[^\w_]/.test(column)) {
      throw new Error('Invalid column name');
    }
    return {
      name: column,
      type: 'column',
      tree: null
    }
  };

  static Col(column) {
    return Graph.Column(column)
  };

  selectOne(...columns) {
    this.queryTree.service_method = "getOne";
    this.Fetch(...columns);
    return this;
  }
  selectAll(...columns) {
    this.queryTree.service_method = "getAll";
    this.Fetch(...columns);
    return this;
  };

  getOne(...columns) {
    this.queryTree.service_method = "getOne";
    this.Fetch(...columns);
    return this.get();
  }
  getAll(...columns) {
    this.queryTree.service_method = "getAll";
    this.Fetch(...columns);
    return this.get();
  };

  Func(func) {
    if (!func)
      throw new Error("Specify fetch method");
    this.queryTree.service_method = func;
    return this;
  };

  Fetch(...columns) {
    columns = columns.map(column => typeof column == 'string' ? Graph.Column(column) : column);
    this.queryTree.columns = [
      ...this.queryTree.columns,
      ...columns
    ];
    return this;
  };

  As(alias) {
    this.queryTree.alias = alias;
    let struct = {
      name: alias,
      type: 'instance',
      method: this.queryTree.service_method,
      service: this.queryTree.service_name,
      page: this.queryTree.page,
      columns: this.queryTree.columns,
      params: this.queryTree.params,
      queries: this.queryTree.queries,
      filters: this.queryTree.filters,
      post_params: this.queryTree.post_params,
      tree: this.queryTree
    };
    return struct
  };



  #paramsToStr(params) {
    return JSON.stringify(params)
  }


  /**
   * @return {string}
   */
  #ColumnToStr(root, columns) {
    let str = "";
    if (columns.length) {
      for (let index in columns) {
        let column = columns[index];
        //  generate params
        if (column.type === "column") {
          str += '&' + root + `[${column.name}][type]=column`
        } else if (column.type === "instance") {
          str += `&${root}[${column.name}][type]=service`;
          if(column.method){
            str += `&${root}[${column.name}][func]=${column.method}`;
          }
          str += `&${root}[${column.name}][service]=${column.service}`;
          str += `&${root}[${column.name}][page]=${column.page}`;
          str += `&${root}[${column.name}][filters]=${this.#paramsToStr(column.filters)}`;
          str += `&${root}[${column.name}][params]=${this.#paramsToStr(column.params)}`;
          str += this.#ColumnToStr(`${root}[${column.name}][columns]`, column.columns)
        }
        //${treeToStr(column.tree)}
      }
    }

    return str;
  };

  #treeToStr(queryTree, root = null) {
    let query = "";
    let _root = "";
    if(queryTree.service_method){
      query += `${queryTree.service_name}[func]=${queryTree.service_method}`;
    }
    query += `&${queryTree.service_name}[service]=${queryTree.service_name}`;
    query += `&${queryTree.service_name}[type]=service`;
    query += `&${queryTree.service_name}[page]=${queryTree.page}`;
    query += `&${queryTree.service_name}[params]=${this.#paramsToStr(queryTree.params)}`;
    query += `&${queryTree.service_name}[filters]=${this.#paramsToStr(queryTree.filters)}`;
    _root = `${queryTree.service_name}[columns]`;
    query += this.#ColumnToStr(_root, queryTree.columns);

    return query;
  };

  toLink() {
    // console.log(JSON.stringify(this.queryTree))
    if (!this.queryTree.service_name)
      throw new Error("Service not specified");

    return this.#treeToStr(this.queryTree, null);
  };


  #makeRequest(endpoint, params, requestConfig) {
    const req = axios.create(requestConfig);

    return new Promise(async (resolve, reject) => {
      try {
        let res = await req.post(endpoint, params);
        res = res.data;
        resolve(new Response(res))
      } catch (e) {
        console.log({
          e
        });
        let res = {
          data: null,
          msg: "",
          status: 0
        };
        res = {
          ...res,
          network_msg: e.message
        };
        if (typeof e.response !== 'undefined') {
          res = {
            ...res
          }
          //            status: e.response.status,
          if (typeof e.response.status !== 'undefined') {
            res['status'] = e.response.status;
          }
          if (typeof e.response.data !== 'undefined') {
            res = {
              ...res,
              ...e.response.data
            }
          }
        }
        reject(new Response(res))
      }
    });
  }
  get() {
    return this.#makeRequest(Graph.endpoint, {
      _____graph: this.toLink(),
      _____method: "GET",
      ...(this.auto_link && {
        _____auto_link: "yes"
      })
    }, Graph.requestConfig)
  };

  post(values = {}) {
    return this.set(values);
  }

  async delete() {
    return this.#makeRequest(Graph.endpoint, {
      _____graph: this.toLink(),
      _____method: "DELETE",
      ...(this.auto_link && {
        _____auto_link: "yes"
      })
    }, Graph.requestConfig)
  };

  async set(values = {}) {
    this.queryTree.post_params = {
      ...this.queryTree.post_params,
      ...values
    };

    return this.#makeRequest(Graph.endpoint, {
      _____graph: this.toLink(),
      _____method: "POST",
      ...this.queryTree.post_params,
      ...(this.auto_link && {
        _____auto_link: "yes"
      })
    }, Graph.requestConfig)

  };

  update(values = {}) {
    this.queryTree.post_params = {
      ...this.queryTree.post_params,
      ...values
    };

    return this.#makeRequest(Graph.endpoint, {
      _____graph: this.toLink(),
      _____method: "PATCH",
      ...this.queryTree.post_params,
      ...(this.auto_link && {
        _____auto_link: "yes"
      })
    }, Graph.requestConfig)

  };


  SetParams(params) {
    this.queryTree.params = {
      ...this.queryTree.params,
      ...params
    };
    return this;
  };

}

export {
  Graph
}
