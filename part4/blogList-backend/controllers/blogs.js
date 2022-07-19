const blogsRouter = require('express').Router()
const Blog = require('../models/blogs')
const User = require('../models/users')
const jwt = require('jsonwebtoken')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

blogsRouter.get('/', async(request, response) => {
    const blogs = await Blog.find({}).populate('user')
    response.json(blogs)
  })
  
blogsRouter.post('/', async(request, response,next) => {
  const body = request.body
  
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    author: body.author ,
    url: body.url,
    likes: body.likes,
    user: user._id
  })
  
  if (blog.likes===undefined) {
      blog.likes = 0;
  }
  if (blog.url === undefined && blog.title === undefined) {  
    response.status(400).send('Bad Request')
  } else {
    const savedBlog = await blog.save()
    
    console.log("blogId", savedBlog)
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
  } 
   
})

blogsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id
  await Blog.findByIdAndDelete(id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body
  const id = request.params.id
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }
  const updatedBlog=await Blog.findByIdAndUpdate(id, blog, { new: true })
  response.json(updatedBlog.toJSON())
})
  
module.exports = blogsRouter;