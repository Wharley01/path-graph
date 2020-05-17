import axios from "axios";
export class Response {
  constructor(
    res = {
      data: null,
      msg: "",
      status: 0,
    }
  ) {
    this.raw_response = res;
  }
  getData() {
    if (typeof this.raw_response["data"] !== "undefined") {
      return this.raw_response.data;
    } else {
      return null;
    }
  }

  getMsg() {
    if (typeof this.raw_response.msg !== "undefined") {
      return this.raw_response.msg;
    } else {
      return null;
    }
  }

  getNetworkErrorMsg() {
    if (typeof this.raw_response["network_msg"] !== "undefined") {
      return this.raw_response.network_msg;
    } else {
      return null;
    }
  }

  getStatus() {
    if (typeof this.raw_response.status !== "undefined") {
      return this.raw_response.status;
    } else {
      return 0;
    }
  }

  getTotalPages() {
    if (typeof this.raw_response.current_page !== "undefined") {
      return this.raw_response.current_page;
    } else {
      return 1;
    }
  }

  getCurrentPage() {
    if (typeof this.raw_response.current_page !== "undefined") {
      return this.raw_response.current_page;
    } else {
      return 1;
    }
  }
}

function FormBuild(fields) {
  let form = new FormData();
  for (let field in fields) {
    if (typeof fields[field] !== 'undefined') {
      let value = fields[field];
      if (value === null)
        continue;
      value = value === false ? 0 : (value === true) ? 1 : value;
      if (typeof value instanceof Array || typeof value instanceof Object)
        value = JSON.parse(value);
      form.append(field, value);
    }
  }
  return form;
}
Graph.requestConfig = {};

Graph.setRequestConfig = function (config) {
  Graph.requestConfig = {
    ...Graph.requestConfig,
    ...config,
  };
};

Graph.Column = function (column) {
  if (/[^\w_]/.test(column)) {
    throw new Error("Invalid column name");
  }
  return {
    name: column,
    type: "column",
    tree: null,
  };
};

Graph.Col = function (column) {
  return Graph.Column(column);
};

export default function Graph() {
  if (!Graph.endpoint) {
    Graph.endpoint = "/path-graph";
  }

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

  this.autoLink = function () {
    this.auto_link = true;
    return this;
  };

  this.service = function (service) {
    service = service.split("/");

    this.queryTree.service_name = service[0];
    if (typeof service[1] !== "undefined") {
      this.func(service[1]);
    }
    return this;
  };

  this.where = function (conditions) {
    this.queryTree.filters = {
      ...this.queryTree.filters,
      ...conditions,
    };
    return this;
  };

  this.ref = function (id) {
    this.queryTree.filters = {
      ...this.queryTree.filters,
      ...{
        id,
      },
    };
    return this;
  };

  this.page = function (page) {
    if (isNaN(page)) {
      throw new Error("Page must be a valid number");
    }
    this.queryTree.page = parseInt(page);
    return this;
  };

  this.selectOne = function (...columns) {
    this.queryTree.service_method = "getOne";
    this.fetch(...columns);
    return this;
  };
  this.selectAll = function (...columns) {
    this.queryTree.service_method = "getAll";
    this.fetch(...columns);
    return this;
  };

  this.getOne = function (...columns) {
    this.queryTree.service_method = "getOne";
    this.fetch(...columns);
    return this.get();
  };
  this.getAll = function (...columns) {
    this.queryTree.service_method = "getAll";
    this.fetch(...columns);
    return this.get();
  };

  this.func = function (func) {
    if (!func) throw new Error("Specify fetch method");
    this.queryTree.service_method = func;
    return this;
  };

  this.fetch = function (...columns) {
    columns = columns.map((column) =>
      typeof column == "string" ? Graph.Column(column) : column
    );
    this.queryTree.columns = [...this.queryTree.columns, ...columns];
    return this;
  };

  this.as = function (alias) {
    this.queryTree.alias = alias;
    return {
      name: alias,
      type: "instance",
      method: this.queryTree.service_method,
      service: this.queryTree.service_name,
      page: this.queryTree.page,
      columns: this.queryTree.columns,
      params: this.queryTree.params,
      queries: this.queryTree.queries,
      filters: this.queryTree.filters,
      post_params: this.queryTree.post_params,
      tree: this.queryTree,
    };
  };

  let paramsToStr = function (params) {
    return JSON.stringify(params);
  };
  let formDataToObj = function (formData) {
    let object = {};
    formData.forEach(function (value, key) {
      object[key] = value;
    });
    return object
  }

  /**
   * @return {string}
   */
  let columnToStr = function (root, columns) {
    let str = "";
    if (columns.length) {
      for (let index in columns) {
        let column = columns[index];
        //  generate params
        if (column.type === "column") {
          str += "&" + root + `[${column.name}][type]=column`;
        } else if (column.type === "instance") {
          str += `&${root}[${column.name}][type]=service`;
          if (column.method) {
            str += `&${root}[${column.name}][func]=${column.method}`;
          }
          str += `&${root}[${column.name}][service]=${column.service}`;
          str += `&${root}[${column.name}][page]=${column.page}`;
          str += `&${root}[${column.name}][filters]=${paramsToStr(
                        column.filters
                    )}`;
          str += `&${root}[${column.name}][params]=${paramsToStr(
                        column.params
                    )}`;
          str += columnToStr(
            `${root}[${column.name}][columns]`,
            column.columns
          );
        }
        //${treeToStr(column.tree)}
      }
    }
    return str;
  };

  let treeToStr = function (queryTree, root = null) {
    let query = "";
    let _root = "";
    if (queryTree.service_method) {
      query += `${queryTree.service_name}[func]=${queryTree.service_method}`;
    }
    query += `&${queryTree.service_name}[service]=${queryTree.service_name}`;
    query += `&${queryTree.service_name}[type]=service`;
    query += `&${queryTree.service_name}[page]=${queryTree.page}`;
    query += `&${queryTree.service_name}[params]=${paramsToStr(
            queryTree.params
        )}`;
    query += `&${queryTree.service_name}[filters]=${paramsToStr(
            queryTree.filters
        )}`;
    _root = `${queryTree.service_name}[columns]`;
    query += columnToStr(_root, queryTree.columns);

    return query;
  };

  this.toLink = function () {
    // console.log(JSON.stringify(this.queryTree))
    if (!this.queryTree.service_name) throw new Error("Service not specified");

    return treeToStr(this.queryTree, null) + (this.auto_link ? '&auto_link=yes' : '');
  };
  let makeRequest = function (endpoint, method = 'get', params = {}) {

    let req = axios.create(Graph.requestConfig);
    return new Promise(async (resolve, reject) => {
      try {
        let res = await req[method](endpoint, params);
        res = res.data;
        resolve(new Response(res));
      } catch (e) {
        let res = {
          data: null,
          msg: "",
          status: 0,
        };
        res = {
          ...res,
          network_msg: e.message,
        };
        if (typeof e.response !== "undefined") {
          res = {
            ...res,
          };
          //            status: e.response.status,
          if (typeof e.response.status !== "undefined") {
            res["status"] = e.response.status;
          }
          if (typeof e.response.data !== "undefined") {
            res = {
              ...res,
              ...e.response.data,
            };
          }
        }
        reject(new Response(res));
      }
    });
  };
  this.get = async function () {
    let link = Graph.endpoint + '?' + this.toLink()
    return makeRequest(link, 'get');
  };

  this.post = function (values = {}) {
    return this.set(values);
  };

  this.delete = async function () {

    let link = Graph.endpoint + '?' + this.toLink();
    return makeRequest(link, 'delete');
  };


  this.set = async function (values = {}) {
    this.queryTree.post_params = {
      ...this.queryTree.post_params,
      ...values,
    };
    let link = Graph.endpoint + '?' + this.toLink();
    return makeRequest(link, 'post', FormBuild(this.queryTree.post_params));
  };

  this.update = async function (values = {}) {
    this.queryTree.post_params = {
      ...this.queryTree.post_params,
      ...values,
    };
    let link = Graph.endpoint + '?' + this.toLink();
    return makeRequest(link, 'patch', FormBuild(this.queryTree.post_params));
  };

  this.params = function (params) {
    this.queryTree.params = {
      ...this.queryTree.params,
      ...params,
    };
    return this;
  };
}

export {
  Graph
};